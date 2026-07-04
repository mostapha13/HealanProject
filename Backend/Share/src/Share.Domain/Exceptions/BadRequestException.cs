namespace Share.Domain.Exceptions
{
    public class BadRequestExceptions : Exception
    {
        public BadRequestExceptions()
        {
        }

        public BadRequestExceptions(string message)
            : base(message)
        {
        }

        public BadRequestExceptions(string message, Exception inner)
            : base(message, inner)
        {
        }
    }
}
