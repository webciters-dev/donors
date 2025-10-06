import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    toast.success("Password reset functionality coming soon");
    navigate("/login");
  }

  return (
    <div className="mx-auto max-w-md w-full">
      <Card className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Reset Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password"
          />
          <Button type="submit" className="w-full">
            Reset Password
          </Button>
        </form>
        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => navigate("/login")}
          >
            Back to sign in
          </button>
        </div>
      </Card>
    </div>
  );
}
