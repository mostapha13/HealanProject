namespace Share.Domain.Exceptions
{
    public static class ExceptionHelper
    {
        public static string GetFullExceptionDetail(this Exception exception)
        {
            if (exception == null)
                return string.Empty;
            var message = string.Empty;
            while (exception != null)
            {
                message += exception.Message + "\n";
                exception = exception.InnerException;
            }
            return message;
        }
    }
}
