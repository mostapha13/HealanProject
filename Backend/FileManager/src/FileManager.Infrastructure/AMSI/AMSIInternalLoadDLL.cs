using Microsoft.Win32.SafeHandles;
using System;
using System.Runtime.InteropServices;

namespace FileManager.Infrastructure.AMSI
{
    #region AMSI Internal
    internal static class Amsi
    {
        // Restrict loading of `amsi.dll` from system32 folder to avoid loading
        [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
        [DllImport("Amsi.dll", EntryPoint = "AmsiInitialize", CallingConvention = CallingConvention.StdCall)]
        internal static extern int AmsiInitialize([MarshalAs(UnmanagedType.LPWStr)] string appName, out AmsiContextSafeHandle amsiContext);

        [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
        [DllImport("Amsi.dll", EntryPoint = "AmsiUninitialize", CallingConvention = CallingConvention.StdCall)]
        internal static extern void AmsiUninitialize(IntPtr amsiContext);

        [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
        [DllImport("Amsi.dll", EntryPoint = "AmsiOpenSession", CallingConvention = CallingConvention.StdCall)]
        internal static extern int AmsiOpenSession(AmsiContextSafeHandle amsiContext, out AmsiSessionSafeHandle session);

        [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
        [DllImport("Amsi.dll", EntryPoint = "AmsiCloseSession", CallingConvention = CallingConvention.StdCall)]
        internal static extern void AmsiCloseSession(AmsiContextSafeHandle amsiContext, IntPtr session);

        [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
        [DllImport("Amsi.dll", EntryPoint = "AmsiScanString", CallingConvention = CallingConvention.StdCall)]
        internal static extern int AmsiScanString(AmsiContextSafeHandle amsiContext, [In, MarshalAs(UnmanagedType.LPWStr)] string payload, [In, MarshalAs(UnmanagedType.LPWStr)] string contentName, AmsiSessionSafeHandle session, out AmsiResult result);

        [DefaultDllImportSearchPaths(DllImportSearchPath.System32)]
        [DllImport("Amsi.dll", EntryPoint = "AmsiScanBuffer", CallingConvention = CallingConvention.StdCall)]
        internal static extern int AmsiScanBuffer(AmsiContextSafeHandle amsiContext, byte[] buffer, uint length, string contentName, AmsiSessionSafeHandle session, out AmsiResult result);

        internal static bool AmsiResultIsMalware(AmsiResult result) => result >= AmsiResult.AMSI_RESULT_DETECTED;
    }

    internal enum AmsiResult
    {
        AMSI_RESULT_CLEAN = 0,
        AMSI_RESULT_NOT_DETECTED = 1,
        AMSI_RESULT_BLOCKED_BY_ADMIN_START = 16384,
        AMSI_RESULT_BLOCKED_BY_ADMIN_END = 20479,
        AMSI_RESULT_DETECTED = 32768,
    }

    internal class AmsiContextSafeHandle : SafeHandleZeroOrMinusOneIsInvalid
    {
        public AmsiContextSafeHandle()
            : base(ownsHandle: true)
        {
        }

        protected override bool ReleaseHandle()
        {
            Amsi.AmsiUninitialize(handle);
            return true;
        }
    }

    internal class AmsiSessionSafeHandle : SafeHandleZeroOrMinusOneIsInvalid
    {
        internal AmsiContextSafeHandle Context { get; set; }

        public AmsiSessionSafeHandle()
            : base(ownsHandle: true)
        {
        }

        public override bool IsInvalid => Context.IsInvalid || base.IsInvalid;

        protected override bool ReleaseHandle()
        {
            Amsi.AmsiCloseSession(Context, handle);
            return true;
        }
    }
    #endregion
}
