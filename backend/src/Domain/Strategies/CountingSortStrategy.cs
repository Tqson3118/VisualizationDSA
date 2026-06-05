using System.Threading;
using VisualizationDSA.Domain.Engine;

namespace VisualizationDSA.Domain.Strategies;

public class CountingSortStrategy : AlgorithmStrategyBase
{
    private const int MaxInputSize = 50;

    public override string AlgorithmId => "counting-sort";
    public override string Name => "Counting Sort (Sắp xếp đếm)";
    public override string Category => "Sorting";

    public override AlgorithmMetadata GetMetadata()
    {
        return new AlgorithmMetadata
        {
            TimeComplexity = "O(N + K)",
            SpaceComplexity = "O(K)",
            Description = "Counting Sort đếm tần suất xuất hiện của mỗi giá trị, tính tổng cộng dồn (prefix sum), rồi đặt phần tử vào đúng vị trí trong mảng kết quả. Ổn định (Stable).",
            PseudoCode = new List<string>
            {
                "countingSort(A):",
                "  count[0..9] = 0",
                "  for each elem in A:",
                "    count[elem % 10]++",
                "  for i from 1 to 9:",
                "    count[i] += count[i-1]",
                "  for i from N-1 downto 0:",
                "    digit = A[i] % 10",
                "    count[digit]--",
                "    output[count[digit]] = A[i]",
                "  A = output"
            }
        };
    }

    public override List<FrameDTO> Execute(int[] inputData, CancellationToken cancellationToken = default)
    {
        InitializeRecorder();

        if (inputData.Length > MaxInputSize)
        {
            throw new ArgumentException(
                $"Kích thước mảng vượt quá giới hạn an toàn (tối đa {MaxInputSize} phần tử).");
        }

        int[] arr = (int[])inputData.Clone();
        int n = arr.Length;
        int[] count = new int[10];

        CaptureState(arr, 0, "Khởi tạo Counting Sort. Ánh xạ các phần tử theo chữ số hàng đơn vị (% 10).");

        // Phase 1: Count frequencies
        for (int i = 0; i < n; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            int digit = Math.Clamp(arr[i] % 10, 0, 9);
            count[digit]++;

            CaptureState(
                arr, 2,
                $"Đếm phần tử A[{i}] = {arr[i]}. Chữ số hàng đơn vị = {digit}. Count[{digit}] = {count[digit]}.",
                compares: new List<int> { i });
        }

        // Phase 2: Prefix sums
        CaptureState(arr, 4, "Bắt đầu tính tổng cộng dồn (Prefix Sum).");

        for (int i = 1; i < 10; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            count[i] += count[i - 1];

            CaptureState(
                arr, 4,
                $"Cộng dồn: Count[{i}] += Count[{i - 1}] = {count[i]}.");
        }

        // Phase 3: Build output (right-to-left for stability)
        int[] output = new int[n];

        CaptureState(arr, 6, "Bắt đầu dựng mảng kết quả. Duyệt từ phải sang trái (Stable Sort).");

        for (int i = n - 1; i >= 0; i--)
        {
            cancellationToken.ThrowIfCancellationRequested();
            int digit = Math.Clamp(arr[i] % 10, 0, 9);
            count[digit]--;
            int outputIdx = count[digit];
            output[outputIdx] = arr[i];

            CaptureState(
                output, 8,
                $"Đặt A[{i}] = {arr[i]} vào Output[{outputIdx}]. Count[{digit}] giảm còn {count[digit]}.",
                swaps: new List<int> { outputIdx });
        }

        CaptureState(
            output, 0,
            "Mảng đã được sắp xếp tăng dần hoàn chỉnh!",
            sorted: Enumerable.Range(0, n).ToList());

        return _frames;
    }
}
