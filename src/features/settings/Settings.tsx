import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Container, Section } from '@/components/layouts';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TumblrConnection } from '@/components/ui/TumblrConnection';
import { userAtom } from '@/store/auth';
import {
  isFileSystemAccessSupported,
  requestDownloadDirectory,
  getDownloadDirectoryName,
  clearDownloadDirectory,
} from '@/utils/downloadDirectory';
import {
  themeModeAtom,
  fontSizeAtom,
  reducedMotionAtom,
  enableHapticsAtom,
  enableGesturesAtom,
  filenamePatternAtom,
  includeIndexInFilenameAtom,
  includeSidecarMetadataAtom,
  downloadMethodAtom,
  gridColumnsAtom,
  gridImageSizeAtom,
  showImageInfoAtom,
  allowDuplicateImageUrlsAtom,
  maxStoredNotesAtom,
  blogFilterLimitAtom,
  slideshowSpeedAtom,
  slideshowIntervalAtom,
  slideshowAutoplayAtom,
  slideshowFullscreenAtom,
  updatePreferencesAtom,
  SLIDESHOW_SPEED_PRESETS,
  type FilenamePattern,
  type GridImageSize,
  type SlideshowSpeed,
} from '@/store/preferences';

const themeModeOptions = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const fontSizeOptions = [
  { id: '14', label: 'Small' },
  { id: '16', label: 'Medium' },
  { id: '18', label: 'Large' },
];

type SettingsTab = 'appearance' | 'display' | 'slideshow' | 'downloads' | 'data' | 'accessibility' | 'security' | 'account';

const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'display', label: 'Display', icon: '📱' },
  { id: 'slideshow', label: 'Slideshow', icon: '🎬' },
  { id: 'downloads', label: 'Downloads', icon: '📥' },
  { id: 'data', label: 'Data', icon: '💾' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'account', label: 'Account', icon: '👤' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // Preferences
  const [themeMode] = useAtom(themeModeAtom);
  const [fontSize] = useAtom(fontSizeAtom);
  const [reducedMotion] = useAtom(reducedMotionAtom);
  const [enableHaptics] = useAtom(enableHapticsAtom);
  const [enableGestures] = useAtom(enableGesturesAtom);
  const [filenamePattern] = useAtom(filenamePatternAtom);
  const [includeIndex] = useAtom(includeIndexInFilenameAtom);
  const [includeSidecarMetadata] = useAtom(includeSidecarMetadataAtom);
  const [downloadMethod] = useAtom(downloadMethodAtom);
  const [gridColumns] = useAtom(gridColumnsAtom);
  const [gridImageSize] = useAtom(gridImageSizeAtom);
  const [showImageInfo] = useAtom(showImageInfoAtom);
  const [allowDuplicateImageUrls] = useAtom(allowDuplicateImageUrlsAtom);
  const [maxStoredNotes] = useAtom(maxStoredNotesAtom);
  const [blogFilterLimit] = useAtom(blogFilterLimitAtom);
  const [slideshowSpeed] = useAtom(slideshowSpeedAtom);
  const [slideshowInterval] = useAtom(slideshowIntervalAtom);
  const [slideshowAutoplay] = useAtom(slideshowAutoplayAtom);
  const [slideshowFullscreen] = useAtom(slideshowFullscreenAtom);
  const [, updatePreferences] = useAtom(updatePreferencesAtom);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // Download directory state
  const [downloadDirName, setDownloadDirName] = useState<string | null>(null);
  const [downloadDirLoading, setDownloadDirLoading] = useState(false);
  const [downloadDirError, setDownloadDirError] = useState<string | null>(null);
  const [downloadDirSupported, setDownloadDirSupported] = useState(false);

  // Check download directory support on mount
  useEffect(() => {
    setDownloadDirSupported(isFileSystemAccessSupported());

    // Load current directory name if set
    const loadDirName = async () => {
      const name = await getDownloadDirectoryName();
      setDownloadDirName(name);
    };
    loadDirName();
  }, []);

  const handleChooseDownloadDirectory = async () => {
    setDownloadDirLoading(true);
    setDownloadDirError(null);

    try {
      const dirHandle = await requestDownloadDirectory();
      if (dirHandle) {
        setDownloadDirName(dirHandle.name);
        setDownloadDirError(null);
      } else {
        // User cancelled
        setDownloadDirError(null);
      }
    } catch (error: any) {
      console.error('[Settings] Error choosing download directory:', error);
      setDownloadDirError(error.message || 'Failed to choose directory');
    } finally {
      setDownloadDirLoading(false);
    }
  };

  const handleClearDownloadDirectory = async () => {
    try {
      await clearDownloadDirectory();
      setDownloadDirName(null);
      setDownloadDirError(null);
    } catch (error: any) {
      console.error('[Settings] Error clearing download directory:', error);
      setDownloadDirError(error.message || 'Failed to clear directory');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (!/[a-zA-Z]/.test(passwordForm.newPassword) || !/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordError('Password must contain at least one letter and one number');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setEmailVerificationSent(true);
      setTimeout(() => setEmailVerificationSent(false), 5000);
    } catch (err) {
      console.error('Failed to resend verification:', err);
    }
  };

  return (
    <Container size="lg">
      <div className="py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Customize your app experience.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close settings"
            title="Close settings"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 space-y-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <>
              <Section>
                <Card>
                  <CardHeader>
                    <CardTitle>Theme & Interface</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme
                      </label>
                      <SegmentedControl
                        options={themeModeOptions}
                        value={themeMode}
                        onChange={value =>
                          updatePreferences({ theme: value as 'light' | 'dark' | 'system' })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Font Size
                      </label>
                      <SegmentedControl
                        options={fontSizeOptions}
                        value={String(fontSize)}
                        onChange={value =>
                          updatePreferences({ fontSize: Number(value) })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </Section>
            </>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reduced Motion
                    </label>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Enabled' },
                        { id: 'false', label: 'Disabled' },
                      ]}
                      value={String(reducedMotion)}
                      onChange={value =>
                        updatePreferences({ reducedMotion: value === 'true' })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Interactions (Accessibility continued) */}
          {activeTab === 'accessibility' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Interactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Haptic Feedback
                    </label>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Enabled' },
                        { id: 'false', label: 'Disabled' },
                      ]}
                      value={String(enableHaptics)}
                      onChange={value =>
                        updatePreferences({ enableHaptics: value === 'true' })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gesture Controls
                    </label>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Enabled' },
                        { id: 'false', label: 'Disabled' },
                      ]}
                      value={String(enableGestures)}
                      onChange={value =>
                        updatePreferences({ enableGestures: value === 'true' })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Image Grid Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Grid Columns
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Number of columns in image grids (2-6)
                    </p>
                    <SegmentedControl
                      options={[
                        { id: '2', label: '2' },
                        { id: '3', label: '3' },
                        { id: '4', label: '4' },
                        { id: '5', label: '5' },
                        { id: '6', label: '6' },
                      ]}
                      value={String(gridColumns)}
                      onChange={value =>
                        updatePreferences({ gridColumns: Number(value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Image Size
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Spacing and padding around grid images
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'compact', label: 'Compact' },
                        { id: 'comfortable', label: 'Comfortable' },
                        { id: 'spacious', label: 'Spacious' },
                      ]}
                      value={gridImageSize}
                      onChange={value =>
                        updatePreferences({ gridImageSize: value as GridImageSize })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Image Info
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Display resolution and size overlay on grid images
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Show' },
                        { id: 'false', label: 'Hide' },
                      ]}
                      value={String(showImageInfo)}
                      onChange={value =>
                        updatePreferences({ showImageInfo: value === 'true' })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Slideshow Tab */}
          {activeTab === 'slideshow' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Slideshow / Carousel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Speed Preset */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slideshow Speed
                    </label>
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Choose a preset or set custom interval
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'very-slow', label: '15s' },
                        { id: 'slow', label: '10s' },
                        { id: 'normal', label: '5s' },
                        { id: 'fast', label: '3s' },
                        { id: 'very-fast', label: '1s' },
                        { id: 'custom', label: 'Custom' },
                      ]}
                      value={slideshowSpeed}
                      onChange={value =>
                        updatePreferences({ slideshowSpeed: value as SlideshowSpeed })
                      }
                    />
                  </div>

                  {/* Custom Interval (only show when custom is selected) */}
                  {slideshowSpeed === 'custom' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custom Interval (seconds)
                      </label>
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        Time to display each image (3-60 seconds)
                      </p>
                      <Input
                        type="number"
                        min="3"
                        max="60"
                        value={slideshowInterval}
                        onChange={e => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value) && value >= 3 && value <= 60) {
                            updatePreferences({ slideshowInterval: value });
                          }
                        }}
                        className="w-32"
                      />
                    </div>
                  )}

                  {/* Autoplay on Open */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-start Slideshow
                    </label>
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Automatically start slideshow when opening image viewer
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Enabled' },
                        { id: 'false', label: 'Disabled' },
                      ]}
                      value={String(slideshowAutoplay)}
                      onChange={value =>
                        updatePreferences({ slideshowAutoplay: value === 'true' })
                      }
                    />
                  </div>

                  {/* Fullscreen Mode */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fullscreen Mode
                    </label>
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Enter fullscreen mode when slideshow starts
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Enabled' },
                        { id: 'false', label: 'Disabled' },
                      ]}
                      value={String(slideshowFullscreen)}
                      onChange={value =>
                        updatePreferences({ slideshowFullscreen: value === 'true' })
                      }
                    />
                  </div>

                  {/* Instructions */}
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                    <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-200">
                      How to use Slideshow
                    </h4>
                    <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                      <li>• Click the <strong>Play ▶</strong> button in the image viewer to start</li>
                      <li>• Click the <strong>Fullscreen ⛶</strong> button to toggle fullscreen mode</li>
                      <li>• Press <strong>Spacebar</strong> to toggle UI visibility (in fullscreen) or play/pause (in normal mode)</li>
                      <li>• Press <strong>ESC</strong> to exit fullscreen or close viewer</li>
                      <li>• UI auto-hides after 3 seconds in fullscreen (move mouse to show)</li>
                      <li>• A progress bar shows time until next image</li>
                      <li>• Arrow keys navigate and briefly show UI</li>
                      <li>• Works in both Blog and Stored image viewers</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Security & Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Verification Status */}
                  {user && !user.emailVerified && (
                    <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
                      <div className="flex items-start">
                        <svg
                          className="h-5 w-5 text-amber-600 dark:text-amber-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Email not verified
                          </h3>
                          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                            Please verify your email address to access all features.
                          </p>
                          {emailVerificationSent ? (
                            <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-300">
                              ✓ Verification email sent! Check your inbox.
                            </p>
                          ) : (
                            <Button
                              onClick={handleResendVerification}
                              size="sm"
                              variant="outline"
                              className="mt-2"
                            >
                              Resend verification email
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Change Password Form */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Change Password
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Update your password to keep your account secure
                      </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <AnimatePresence mode="wait">
                        {passwordError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-400"
                          >
                            {passwordError}
                          </motion.div>
                        )}

                        {passwordSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/50 dark:text-green-400"
                          >
                            ✓ Password changed successfully
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          placeholder="Enter current password"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          placeholder="Enter new password"
                          minLength={8}
                          required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Must be at least 8 characters with letters and numbers
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          placeholder="Confirm new password"
                          minLength={8}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        isLoading={passwordLoading}
                        disabled={passwordLoading}
                      >
                        Change Password
                      </Button>
                    </form>
                  </div>

                  {/* Security Info */}
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                    <div className="flex">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Password Security
                        </h3>
                        <div className="mt-1 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <p>• Passwords are encrypted using bcrypt (12 rounds)</p>
                          <p>• Never shared with third parties</p>
                          <p>• Use a unique password for this account</p>
                          {user?.lastLoginAt && (
                            <p>• Last login: {new Date(user.lastLoginAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Downloads Tab */}
          {activeTab === 'downloads' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>File Downloads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Filename Pattern
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose how downloaded images are named
                    </p>
                    <div className="space-y-2">
                      {[
                        { value: 'original', label: 'Original (Tumblr)', example: 'tumblr_psmx07p9EQ1u545pyo1_640.jpg' },
                        { value: 'blog-original', label: 'Blog + Original', example: 'oldguyjb_tumblr_psmx07p9EQ1u545pyo1_640.jpg' },
                        { value: 'blog-tags-date', label: 'Blog + Tags + Date', example: 'photoarchive_photography_landscape_2025-10-15_001.jpg' },
                        { value: 'date-blog-tags', label: 'Date + Blog + Tags', example: '2025-10-15_photoarchive_photography_landscape_001.jpg' },
                        { value: 'blog-description', label: 'Blog + Description', example: 'photoarchive_amazing_sunset_photo_2025-10-15.jpg' },
                        { value: 'tags-only', label: 'Tags Only', example: 'photography_landscape_sunset_001.jpg' },
                        { value: 'timestamp', label: 'Timestamp', example: 'photoarchive_1760549272501_1.jpg' },
                        { value: 'simple', label: 'Simple', example: 'image_001.jpg' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updatePreferences({ filenamePattern: option.value as FilenamePattern })}
                          className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${filenamePattern === option.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                            {filenamePattern === option.value && (
                              <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {option.example}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Index Number
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add sequential numbers (001, 002, etc.) to filenames
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Yes' },
                        { id: 'false', label: 'No' },
                      ]}
                      value={String(includeIndex)}
                      onChange={value =>
                        updatePreferences({ includeIndexInFilename: value === 'true' })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Download Method
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose how images are downloaded
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'client-side', label: 'Client-side (Browser)' },
                        { id: 'server-side', label: 'Server-side (Parallel)' },
                      ]}
                      value={downloadMethod}
                      onChange={value =>
                        updatePreferences({ downloadMethod: value as 'client-side' | 'server-side' })
                      }
                    />
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <strong className="text-gray-900 dark:text-gray-200">Server-side</strong> downloads use parallel fetching (like Python's asyncio/aiohttp) for faster downloads, especially on mobile.
                          <strong className="text-gray-900 dark:text-gray-200 ml-1">Client-side</strong> uses your browser directly (may be slower for many images).
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Metadata Files (.txt)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Download a .txt file with each image containing blog name, tags, description, notes, and post URL
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'true', label: 'Yes' },
                        { id: 'false', label: 'No' },
                      ]}
                      value={String(includeSidecarMetadata)}
                      onChange={value =>
                        updatePreferences({ includeSidecarMetadata: value === 'true' })
                      }
                    />
                  </div>

                  {/* Download Directory */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Download Folder
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {downloadDirSupported
                        ? 'Choose where downloaded images are saved'
                        : 'Your browser does not support custom download folders. Files will download to your default downloads folder.'}
                    </p>

                    {downloadDirSupported ? (
                      <div className="space-y-3">
                        {/* Current Directory Display */}
                        {downloadDirName && (
                          <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3 dark:bg-green-950 dark:border-green-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    {downloadDirName}
                                  </p>
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    Active download folder
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearDownloadDirectory}
                                className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                              >
                                Use Default
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Choose Folder Button */}
                        <Button
                          onClick={handleChooseDownloadDirectory}
                          isLoading={downloadDirLoading}
                          disabled={downloadDirLoading}
                          className="w-full"
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {downloadDirName ? 'Change Download Folder' : 'Choose Download Folder'}
                        </Button>

                        {/* Error Display */}
                        {downloadDirError && (
                          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                            <p className="text-sm text-red-800 dark:text-red-200">
                              {downloadDirError}
                            </p>
                          </div>
                        )}

                        {/* Info */}
                        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
                          <div className="flex items-start gap-2">
                            <svg className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              You'll need to grant permission each time your browser restarts for security reasons.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          💡 This feature requires Chrome, Edge, or Opera. Firefox and Safari use your browser's default download location.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                    <div className="flex">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Metadata Sidecar Files
                        </h3>
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                          Each downloaded image includes a .txt file with complete metadata: blog name, tags, description, notes count, and post URL.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <Section>
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Allow Duplicate Image URLs
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When storing images to database, allow the same image URL from different blogs (reblogs, cross-posts)
                    </p>
                    <SegmentedControl
                      options={[
                        { id: 'false', label: 'Strict (No Duplicates)' },
                        { id: 'true', label: 'Allow Duplicates' },
                      ]}
                      value={String(allowDuplicateImageUrls)}
                      onChange={value =>
                        updatePreferences({ allowDuplicateImageUrls: value === 'true' })
                      }
                    />
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <strong className="text-gray-900 dark:text-gray-200">Strict mode (default)</strong> prevents storing the same image URL twice, even from different blogs (saves space, prevents reblogs).
                          <strong className="text-gray-900 dark:text-gray-200 ml-1">Allow duplicates</strong> lets you store the same image from multiple blogs (tracks different contexts/tags).
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Maximum Stored Notes Per Image
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Limit how many notes (likes, reblogs, comments) to store with each image (reduces database size)
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="10"
                        max="200"
                        step="10"
                        value={maxStoredNotes}
                        onChange={e => updatePreferences({ maxStoredNotes: parseInt(e.target.value) || 50 })}
                        placeholder="50"
                        className="w-32 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">notes per image</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current: {maxStoredNotes} notes per image (range: 10-200)
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Blog Filter Display Limit
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Number of blogs to show in the filter dropdown on Stored Images page
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="5"
                        max="100"
                        step="5"
                        value={blogFilterLimit}
                        onChange={e => updatePreferences({ blogFilterLimit: parseInt(e.target.value) || 20 })}
                        placeholder="20"
                        className="w-32 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">blogs</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current: Showing {blogFilterLimit} blogs (range: 5-100)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Section>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Section>
              <TumblrConnection />
            </Section>
          )}
        </div>
      </div>


    </Container>
  );
}