'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import React from 'react';
const ComponentsAuthLoginForm = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage(''); 
        try {
            const response = await fetch(`${process.env.domainApi}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            console.log(response);
            if (response.ok) {
                const data = await response.json();
                const expireAT = data.expiresAt;
                if (data.token) {
                    sessionStorage.setItem('role', data.role_id);
                    sessionStorage.setItem('emailLockScreen', data.email);
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('username', data.username);
                    sessionStorage.setItem('userId', data.id)
                    sessionStorage.setItem('loginTime', Math.floor(Date.now() / 1000));
                    sessionStorage.setItem('expireAT', expireAT);
                    router.push('/');
                } else {
                    console.log(data);
                    setErrorMessage('Sai thông tin đăng nhập');
                    router.push('/auth/boxed-signin');
                }
            } else {
                setErrorMessage('Sai thông tin đăng nhập');
            }
        } catch (error) {
            setErrorMessage('An error occurred: ' + error.message);
        }
    };

    return (
        <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Email">Email</label>
                <div className="relative text-white-dark">
                    <input
                        id="Email"
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input ps-10 placeholder:text-white-dark" 
                        style={{ paddingLeft : "2.5rem" }}
                        />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconMail fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="Password">Password</label>
                <div className="relative text-white-dark">
                    <input
                        id="Password"
                        type="password"
                        placeholder="Enter Password"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingLeft : "2.5rem" }}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconLockDots fill={true} />
                    </span>
                </div>
            </div>
            {errorMessage && (
                <div className="text-red-500">
                    {errorMessage}
                </div>
            )}
            <button
                type="submit"
                className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
                Sign in
            </button>
        </form>
    );
};

export default ComponentsAuthLoginForm;