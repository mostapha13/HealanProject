using Share.Application.Common.Interfaces;
using System.Collections.Concurrent;

namespace Share.Application.Common.Services;

public class InMemoryQueue<T> : IInMemoryQueue<T>
{
    private readonly ConcurrentQueue<T> _queue = new();

    public void Enqueue(T item) => _queue.Enqueue(item);
    public bool TryDequeue(out T item) => _queue.TryDequeue(out item);
    public bool IsEmpty => _queue.IsEmpty;
}