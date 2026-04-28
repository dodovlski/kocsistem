import { AuthForm } from "@/components/auth/AuthForm";
import { login } from "@/server/actions/auth";

export default function LoginPage() {
  return <AuthForm action={login} mode="login" />;
}
