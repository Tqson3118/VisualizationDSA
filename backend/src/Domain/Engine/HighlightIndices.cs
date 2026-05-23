namespace VisualizationDSA.Domain.Engine;

/// <summary>
/// Các con trỏ làm nổi bật hiển thị trên UI.
/// </summary>
public class HighlightIndices
{
    public List<int> Compare { get; set; } = new();
    public List<int> Swap { get; set; } = new();
    public List<int> Sorted { get; set; } = new();
}
