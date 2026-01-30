import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuthStore } from '../../store/studentAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentLoginPage() {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [localError, setLocalError] = useState('');

  const { login, setPassword: setStudentPassword, isLoading, error, clearError } = useStudentAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    try {
      await login(studentId, password, classId ? parseInt(classId) : undefined);
      navigate('/student/dashboard');
    } catch {
      // Error is handled in store
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (!classId) {
      setLocalError('Class ID is required for first-time setup');
      return;
    }

    try {
      await setStudentPassword(studentId, parseInt(classId), password);
      navigate('/student/dashboard');
    } catch {
      // Error is handled in store
    }
  };

  const handleModeChange = (value: string) => {
    setMode(value as 'login' | 'setup');
    setLocalError('');
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Student Portal</CardTitle>
          <CardDescription>
            Access your quizzes, exams, and grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="setup">First Time Setup</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-studentId">Student ID</Label>
                  <Input
                    id="login-studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-classId">Class ID (optional)</Label>
                  <Input
                    id="login-classId"
                    type="text"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    placeholder="Required if same ID in multiple classes"
                  />
                </div>
                {(error || localError) && (
                  <Alert variant="destructive">
                    <AlertDescription>{error || localError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="setup">
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-studentId">Student ID</Label>
                  <Input
                    id="setup-studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-classId">Class ID</Label>
                  <Input
                    id="setup-classId"
                    type="text"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    placeholder="Enter your class ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-password">New Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-confirmPassword">Confirm Password</Label>
                  <Input
                    id="setup-confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                {(error || localError) && (
                  <Alert variant="destructive">
                    <AlertDescription>{error || localError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Set Password & Login'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Teacher Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
