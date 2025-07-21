import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Update email in Supabase Auth
      const { error: authError } = await window.supabase.auth.updateUser({ email });
      if (authError) throw authError;
      setSuccess('Email updated! Please check your inbox to confirm the change.');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update email.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">You must be logged in to view your profile.</div>;

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <div className="flex gap-2 items-center">
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={!editing}
                className="flex-1"
              />
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)} size="sm">Edit</Button>
              ) : (
                <Button onClick={handleSave} size="sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Full Name</label>
            <Input value={profile?.full_name || ''} disabled />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Phone Number</label>
            <Input value={profile?.phone_number || ''} disabled />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Country Code</label>
            <Input value={profile?.country_code || ''} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 