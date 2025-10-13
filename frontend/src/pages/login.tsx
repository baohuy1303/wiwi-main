import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Checkbox } from '@heroui/react';
import { useState, useEffect } from 'react';
import { useUser } from '@/UserContext';
import DefaultLayout from '@/layouts/default';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { login, loading, error, isAuthenticated } = useUser();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
    };

    return (
        <DefaultLayout>
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg border border-slate-700">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white">
                            Oh Hi!
                        </h1>
                        <p className="text-gray-300">Sign in to continue.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Input
                                type="email"
                                label="Email"
                                placeholder="you@example.com"
                                variant="bordered"
                                className="text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                variant="bordered"
                                className="text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        {/* <div className="flex items-center justify-between">
                            <Checkbox
                                isSelected={rememberMe}
                                onValueChange={setRememberMe}
                                disabled={loading}
                            >
                                <span className="text-gray-300">
                                    Remember me
                                </span>
                            </Checkbox>
                            <Link
                                to="#"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div> */}
                        <Button
                            color="primary"
                            className="w-full font-bold"
                            type="submit"
                            isLoading={loading}
                            disabled={loading}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                    <div className="text-center text-gray-400">
                        <p>
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}
