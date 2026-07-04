using System;
using System.ComponentModel;

namespace FileManager.Infrastructure.AMSI
{
    public sealed class AmsiContext : IDisposable
    {
        private readonly AmsiContextSafeHandle _context;

        private AmsiContext(AmsiContextSafeHandle context)
        {
            _context = context;
        }

        public static AmsiContext Create(string applicationName)
        {
            int result = Amsi.AmsiInitialize(applicationName, out var context);
            if (result != 0)
                throw new Win32Exception(result);

            return new AmsiContext(context);
        }

        public AmsiSession CreateSession()
        {
            var result = Amsi.AmsiOpenSession(_context, out var session);
            session.Context = _context;
            if (result != 0)
                throw new Win32Exception(result);

            return new AmsiSession(_context, session);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }

    public sealed class AmsiSession : IDisposable
    {
        private readonly AmsiContextSafeHandle _context;
        private readonly AmsiSessionSafeHandle _session;

        internal AmsiSession(AmsiContextSafeHandle context, AmsiSessionSafeHandle session)
        {
            _context = context;
            _session = session;
        }

        public bool IsMalware(string payload, string contentName)
        {
            var returnValue = Amsi.AmsiScanString(_context, payload, contentName, _session, out var result);
            if (returnValue != 0)
                throw new Win32Exception(returnValue);

            return Amsi.AmsiResultIsMalware(result);
        }

        public bool IsMalware(byte[] payload, string contentName)
        {
            var returnValue = Amsi.AmsiScanBuffer(_context, payload, (uint)payload.Length, contentName, _session, out var result);
            if (returnValue != 0)
                throw new Win32Exception(returnValue);

            return Amsi.AmsiResultIsMalware(result);
        }

        public void Dispose()
        {
            _session.Dispose();
        }
    }
}
