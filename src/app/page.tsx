import { AuthPageShell } from "../components/AuthPageShell";
import { RegisterForm } from "../components/RegisterForm";

export default function HomePage() {
  return (
    <AuthPageShell>
      <RegisterForm />
    </AuthPageShell>
  );
}
