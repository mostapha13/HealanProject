import React, { useEffect, useState } from 'react';
import withAlert from '../../hoc/withAlert';
import healanApi from '../../api/healanApi';
import { changePassword, updateIdentityProfile } from '../../api/accountApi';
import { PageHeader } from '../../components/Ui';
import { useUserAccess } from '../../context/UserAccessContext';

function ProfilePage({ onAlert }: { onAlert: (msg: unknown) => void }) {
  const { currentUser, reload } = useUserAccess();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setFirstName(currentUser?.firstName ?? '');
    setLastName(currentUser?.lastName ?? '');
    setPhoneNumber(currentUser?.phoneNumber ?? currentUser?.userName ?? '');
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      onAlert({ type: 'error', message: 'نام، نام خانوادگی و موبایل الزامی است' });
      return;
    }
    setSavingProfile(true);
    try {
      await updateIdentityProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      try {
        await healanApi.users.updateMyProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
        });
      } catch {
        // Identity updated; Healan row may be missing for some accounts
      }
      await reload();
      onAlert({ type: 'success', message: 'اطلاعات پروفایل ذخیره شد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      onAlert({ type: 'error', message: 'رمز فعلی و رمز جدید را وارد کنید' });
      return;
    }
    if (newPassword.length < 6) {
      onAlert({ type: 'error', message: 'رمز جدید حداقل ۶ کاراکتر باشد' });
      return;
    }
    if (newPassword !== confirmPassword) {
      onAlert({ type: 'error', message: 'رمز جدید و تکرار آن یکسان نیست' });
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onAlert({ type: 'success', message: 'رمز عبور با موفقیت تغییر کرد' });
    } catch (err) {
      onAlert(err);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        title="حساب کاربری من"
        subtitle="ویرایش اطلاعات عمومی و تغییر رمز عبور"
      />

      <div className="healan-card" style={{ marginBottom: '1rem' }}>
        <div className="healan-card__body">
          <h3 style={{ marginTop: 0 }}>اطلاعات عمومی</h3>
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>نام</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="healan-form-field">
              <label>نام خانوادگی</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="healan-form-field">
              <label>موبایل / نام کاربری</label>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} dir="ltr" />
            </div>
            {currentUser?.roleTitle && (
              <div className="healan-form-field">
                <label>نقش</label>
                <input value={currentUser.roleTitle} readOnly className="healan-input--readonly" />
              </div>
            )}
          </div>
          <div className="healan-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="healan-btn healan-btn--primary"
              disabled={savingProfile}
              onClick={() => void handleSaveProfile()}
            >
              {savingProfile ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
            </button>
          </div>
        </div>
      </div>

      <div className="healan-card">
        <div className="healan-card__body">
          <h3 style={{ marginTop: 0 }}>تغییر رمز عبور</h3>
          <div className="healan-form-grid">
            <div className="healan-form-field">
              <label>رمز فعلی</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="healan-form-field">
              <label>رمز جدید</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="healan-form-field">
              <label>تکرار رمز جدید</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="healan-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="healan-btn healan-btn--primary"
              disabled={savingPassword}
              onClick={() => void handleChangePassword()}
            >
              {savingPassword ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(ProfilePage);
