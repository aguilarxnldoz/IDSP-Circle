'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import RegisterEmailDescription from '@/components/user_registration/enter_email/email_description';
import RegisterEmailHeader from '@/components/user_registration/enter_email/email_header';
import { BackButton } from '@/components/user_registration/back_button';
import EnterEmail from '@/components/user_registration/enter_email/enter_email';
import { RegisterPasswordHeader } from '@/components/user_registration/create_password/password_header';
import RegisterPasswordDescription from '@/components/user_registration/create_password/password_description';
import CreatePassword from '@/components/user_registration/create_password/create_password';
import RegisterFullnameHeader from '@/components/user_registration/enter_fullname/fullname_header';
import RegisterFullnameDescription from '@/components/user_registration/enter_fullname/fullname_description';
import EnterFullname from '@/components/user_registration/enter_fullname/enter_fullname';
import RegisterUsernameDescription from '@/components/user_registration/create_username/username_description';
import RegisterUsernameHeader from '@/components/user_registration/create_username/username_header';
import CreateUsername from '@/components/user_registration/create_username/create_username';
import AddProfilePicture from '@/components/user_registration/add_profilepicture/add_profilepicture';
import Confirmation from '@/components/user_registration/confirmation';
import dynamic from 'next/dynamic';

// Dynamically import the OnboardingTutorial to avoid hydration issues with localStorage
const OnboardingTutorial = dynamic(() => import('@/components/onboarding/OnboardingTutorial'), {
	ssr: false,
});

export default function Register() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: '',
		confirmEmail: '',
		password: '',
		confirmPassword: '',
		fullName: '',
		firstName: '',
		lastName: '',
		username: '',
		profileImage: '',
	});
	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [registrationError, setRegistrationError] = useState<string | null>(null);
	const handleBack = () => {
		// Clear any registration errors when going back
		setRegistrationError(null);

		if (step === 1) {
			router.push('/auth/login');
			return;
		}

		setStep(prev => prev - 1);
	};
	const handleRegisterEmail = () => {
		console.log(`STEP: 1 ${formData.email}`);
		console.log(`STEP ${formData.confirmEmail}`);

		// Clear any previous errors
		setRegistrationError(null);

		if (formData.email.length === 0 || formData.confirmEmail.length === 0) {
			setRegistrationError('Must enter an email');
			return;
		}

		if (formData.email !== formData.confirmEmail) {
			setRegistrationError('Emails do not match!');
			return;
		}

		if (step === 1 && formData.email === formData.confirmEmail) {
			setStep(prev => prev + 1);
		}
	};
	const handleRegisterPassword = () => {
		console.log('STEP 2', formData.password);
		console.log('STEP 2', formData.confirmPassword);

		// Clear any previous errors
		setRegistrationError(null);

		if (step !== 2) {
			router.push('/auth/login');
		}

		// Basic validation - detailed validation is now handled in real-time by the components
		if (!formData.password || !formData.confirmPassword) {
			setRegistrationError('Please complete all password fields');
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setRegistrationError('Passwords do not match');
			return;
		}

		// If basic checks pass, proceed to next step
		if (step === 2) {
			setStep(prev => prev + 1);
		}
	};

	const handleRegisterFullname = () => {
		console.log('STEP 4', formData.fullName);
		console.log('STEP 4', formData.firstName);
		console.log('STEP 4', formData.lastName);

		if (!formData.fullName) {
			throw new Error('Enter your full name');
		}

		if (formData.fullName.includes('123456789')) {
			throw new Error('Alphabetical characters only');
		}

		if (step === 3) return setStep(prev => prev + 1);
	};
	const handleCreateUsername = () => {
		console.log('STEP 5 ', formData.username);

		// Validate username
		if (!formData.username || formData.username.trim() === '') {
			throw new Error('Username is required');
		}

		// Check length
		if (formData.username.length < 3) {
			throw new Error('Username must be at least 3 characters long');
		}

		if (formData.username.length > 20) {
			throw new Error('Username must be at most 20 characters long');
		}
		// Check for valid characters
		if (!/^[a-z0-9_-]+$/.test(formData.username)) {
			throw new Error('Username can only contain lowercase letters, numbers, underscores (_) and hyphens (-)');
		}

		// Check if username starts with a letter
		if (!/^[a-z]/.test(formData.username)) {
			throw new Error('Username must start with a lowercase letter');
		}

		// Check if username ends with hyphen or underscore
		if (/[-_]$/.test(formData.username)) {
			throw new Error('Username cannot end with a hyphen (-) or underscore (_)');
		}

		// If all checks pass, proceed to the next step
		if (step === 4) return setStep(prev => prev + 1);
	};

	const handleUploadProfileImage = () => {
		setStep(prev => prev + 1);
	};
	const handleCreateProfile = async () => {
		setLoading(true);
		setSuccess(false);
		setRegistrationError(null);

		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ formData }),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(true);
				// Sign in the user automatically after successful registration
				const result = await signIn('credentials', {
					email: formData.email,
					password: formData.password,
					redirect: false,
				});

				if (result?.ok) {
					// Show onboarding tutorial before redirecting
					setShowOnboarding(true);
				} else {
					setRegistrationError('Account created but login failed. Please try logging in manually.');
					setTimeout(() => router.push('/auth/login'), 3000);
				}
			} else {
				// Handle specific error types
				if (data.field) {
					// Field-specific errors (email/username already taken)
					if (data.field === 'email') {
						setStep(1); // Go back to email step
						setRegistrationError(data.error);
					} else if (data.field === 'username') {
						setStep(4); // Go back to username step
						setRegistrationError(data.error);
					}
				} else if (data.details) {
					// Validation errors
					setRegistrationError(`Validation failed: ${data.details.map((d: any) => d.message).join(', ')}`);
				} else {
					// General error
					setRegistrationError(data.error || 'Failed to create account. Please try again.');
				}
			}
		} catch (error: unknown) {
			console.error('Registration error:', error);
			setRegistrationError('Network error. Please check your connection and try again.');
		} finally {
			setLoading(false);
		}
	};
	return (
		<div
			id='register-page-wrapper'
			className='mx-6 relative h-screen'
		>
			<div
				id='previous-page'
				className='mt-10 mb-15 text-2xl'
			>
				<BackButton handleBack={handleBack} />
			</div>
			{registrationError && (
				<div className='mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg'>
					<p className='text-white text-sm font-medium'>{registrationError}</p>
				</div>
			)}
			{step === 1 && (
				<>
					<div
						id='step-one'
						className='h-full'
					>
						<div className='mb-20'>
							<RegisterEmailHeader />
							<RegisterEmailDescription />
						</div>
						<EnterEmail
							formData={formData}
							setFormData={setFormData}
							onNext={handleRegisterEmail}
						/>
					</div>
				</>
			)}
			{step === 2 && (
				<>
					<div id='step-two'>
						<div className='mb-20'>
							<RegisterPasswordHeader />
							<RegisterPasswordDescription />
						</div>
						<CreatePassword
							formData={formData}
							setFormData={setFormData}
							onNext={handleRegisterPassword}
						/>
					</div>
				</>
			)}
			{step === 3 && (
				<div id='step-four'>
					<div className='mb-20'>
						<RegisterFullnameHeader />
						<RegisterFullnameDescription />
					</div>
					<EnterFullname
						formData={formData}
						setFormData={setFormData}
						onNext={handleRegisterFullname}
					/>
				</div>
			)}
			{step === 4 && (
				<div id='step-five'>
					<div className='mb-20'>
						<RegisterUsernameHeader />
						<RegisterUsernameDescription />
					</div>
					<CreateUsername
						formData={formData}
						setFormData={setFormData}
						onNext={handleCreateUsername}
					/>
				</div>
			)}
			{step === 5 && (
				<div id='step-six'>
					<div className='mb-20'>
						<h1 className='register-headers'>Add a profile picture</h1>
						<div
							className='register-descriptions'
							id='register-profileimage-descriptions'
						>
							<p>Add a profile picture so your friends know it&apos;s you. Everyone will be able to see your picture</p>
						</div>
					</div>
					<AddProfilePicture
						formData={formData}
						setFormData={setFormData}
						onNext={handleUploadProfileImage}
					/>
				</div>
			)}{' '}
			{step === 6 && (
				<Confirmation
					formData={formData}
					onSubmit={handleCreateProfile}
					loading={loading}
					success={success}
				/>
			)}
			{showOnboarding && (
				<OnboardingTutorial
					onComplete={() => {
						setShowOnboarding(false);
						// Navigate directly to the user's profile using their username
						// This avoids relying on the session being fully populated
						if (formData.username) {
							router.push(`/${formData.username}`);
						} else {
							router.push('/home');
						}
					}}
				/>
			)}
		</div>
	);
}
