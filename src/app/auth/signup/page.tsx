import { Suspense } from "react";
import SignupPage from "./SignupPage";

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPage />
    </Suspense>
  );
}
