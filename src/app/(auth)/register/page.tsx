import { AuthForm } from "@/components/auth/AuthForm";
import { register } from "@/server/actions/auth";

export default function RegisterPage() {
  return <AuthForm action={register} mode="register" />;
}
