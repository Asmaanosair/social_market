import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold">
          SM
        </div>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Get started with Social Market</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full">Google</Button>
          <Button variant="outline" className="w-full">GitHub</Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">Or continue with</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">Name</label>
          <Input id="name" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="name@example.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <Input id="password" type="password" placeholder="Create a password" />
        </div>
        <Button className="w-full">Create Account</Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-neutral-900 hover:underline">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
