"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Shield,
    Calendar,
    Edit3,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    bio: string;
}

// ============================================================================
// Account Page Component
// ============================================================================

export default function AccountPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
    const { isDarkMode } = useTheme();
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
    
    const [formData, setFormData] = React.useState<ProfileFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: "Tunisia",
        bio: "",
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initialize form data from user
    React.useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || "",
                address: "",
                city: "",
                postalCode: "",
                country: "Tunisia",
                bio: "",
            });
        }
    }, [user]);

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/login?redirect=/account");
        }
    }, [isLoading, isAuthenticated, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size should be less than 5MB");
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone || undefined,
                avatar: avatarPreview || undefined,
            });
            
            setSuccess("Profile updated successfully!");
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.message || "Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || "",
                address: "",
                city: "",
                postalCode: "",
                country: "Tunisia",
                bio: "",
            });
        }
        setAvatarPreview(null);
        setIsEditing(false);
        setError(null);
    };

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading your profile...</p>
                </div>
            </main>
        );
    }

    // Not authenticated
    if (!user) {
        return null;
    }

    const isAdmin = user.role?.toLowerCase() === 'admin';
    const userInitial = (user.firstName?.[0] || user.email[0]).toUpperCase();
    const displayAvatar = avatarPreview || user.avatar;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">Back to Home</span>
                        </Link>
                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Account</h1>
                    </div>
                    
                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="border-gray-200 dark:border-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
                        <button onClick={() => setError(null)}>
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group">
                                    <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        {displayAvatar ? (
                                            <Image
                                                src={displayAvatar}
                                                alt={user.firstName || 'User'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-3xl font-bold">{userInitial}</span>
                                        )}
                                    </div>
                                    
                                    {isEditing && (
                                        <>
                                            <button
                                                onClick={handleAvatarClick}
                                                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            >
                                                <Camera className="h-6 w-6 text-white" />
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                        </>
                                    )}
                                </div>
                                
                                <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}` 
                                        : user.email.split('@')[0]}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                
                                {isAdmin && (
                                    <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium">
                                        <Shield className="h-3.5 w-3.5" />
                                        Administrator
                                    </span>
                                )}
                            </div>

                            {/* Account Info */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Member since</span>
                                    <span className="text-gray-900 dark:text-white ml-auto">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Email</span>
                                    <span className={cn(
                                        "ml-auto text-xs px-2 py-0.5 rounded-full",
                                        user.emailVerified 
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                    )}>
                                        {user.emailVerified ? "Verified" : "Unverified"}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 space-y-2">
                                <Link
                                    href="/account/orders"
                                    className="block w-full px-4 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    View My Orders
                                </Link>
                                <Link
                                    href="/account/settings"
                                    className="block w-full px-4 py-2.5 text-sm text-center text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    Account Settings
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Personal Information
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-700 dark:text-gray-300">First Name</Label>
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-700 dark:text-gray-300">Last Name</Label>
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Email Address</Label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="mt-1 bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 opacity-60 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Email cannot be changed. Contact support if needed.
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Phone Number</Label>
                                    <Input
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="+216 XX XXX XXX"
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Address Information
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Street Address</Label>
                                    <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="123 Main Street"
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-700 dark:text-gray-300">City</Label>
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="Tunis"
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-700 dark:text-gray-300">Postal Code</Label>
                                    <Input
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="1000"
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Country</Label>
                                    <Input
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="mt-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                About Me
                            </h3>
                            
                            <Textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder="Tell us a bit about yourself..."
                                rows={4}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 disabled:opacity-60 resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
