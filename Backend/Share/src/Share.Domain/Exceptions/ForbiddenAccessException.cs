namespace Share.Domain.Exceptions
{
    public class ForbiddenAccessExceptions : Exception
    {
        public ForbiddenAccessExceptions() : base() { }
        public ForbiddenAccessExceptions(string message)
      : base(message)
        {
        }

        public ForbiddenAccessExceptions(string message, Exception inner)
            : base(message, inner)
        {
        }
    }
}
