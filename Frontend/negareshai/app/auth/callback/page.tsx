"use client";

import { useEffect, useState } from "react";
import { finishSignin } from "../../../lib/auth";

export default function AuthCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    finishSignin()
      .then(returnUrl => window.location.replace(returnUrl))
      .catch(reason => setError(reason instanceof Error ? reason.message : "ورود تکمیل نشد."));
  }, []);
  return <main className="auth-callback"><p>{error || "در حال تکمیل ورود امن سازمانی..."}</p></main>;
}
