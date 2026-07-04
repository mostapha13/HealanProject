namespace Share.Application.Common.Interfaces;

public interface IInMemoryQueue<T>
{
    void Enqueue(T item);
    bool TryDequeue(out T item);
    bool IsEmpty { get; }
}