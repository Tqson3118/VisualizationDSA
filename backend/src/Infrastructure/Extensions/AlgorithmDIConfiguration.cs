using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using VisualizationDSA.Domain.Strategies;

namespace VisualizationDSA.Infrastructure.Extensions;

/// <summary>
/// Tự động quét và đăng ký tất cả các Class triển khai IAlgorithmStrategy vào DI Container.
/// Sử dụng Reflection để tuân thủ Open/Closed Principle (SOLID).
/// </summary>
public static class AlgorithmDIConfiguration
{
    public static IServiceCollection AddAlgorithmStrategies(this IServiceCollection services)
    {
        var strategyTypes = Assembly.GetAssembly(typeof(IAlgorithmStrategy))!
            .GetTypes()
            .Where(type => typeof(IAlgorithmStrategy).IsAssignableFrom(type)
                        && !type.IsInterface
                        && !type.IsAbstract);

        foreach (var type in strategyTypes)
        {
            services.AddTransient(typeof(IAlgorithmStrategy), type);
        }

        return services;
    }
}
