// ===== Trang ho so: sua ten, doi mat khau (Chuan hoa luong Form Validation UX) =====
(async function () {
  const initData = await initPage('profile');
  const user = initData.user;
  const equipped = initData.equipped || {};

  const initial = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
  const avatarEl = $('pAvatar');
  avatarEl.textContent = initial;
  if (equipped.avatarFrameClass || equipped.avatarFrame) {
    avatarEl.classList.add(equipped.avatarFrameClass || equipped.avatarFrame);
  }
  $('pDisplayName').textContent = user.fullName || user.username;
  $('pUser').textContent = user.username;
  $('pRole').innerHTML = `<span class="badge ${esc(user.role)}">${esc(user.role)}</span>`;
  $('pName').value = user.fullName || '';

  // Luồng Form Đổi Tên Hiển Thị
  $('formProfile').onsubmit = async (ev) => {
    ev.preventDefault();
    const box = $('alertInfo');
    hideAlert(box);

    const nameInput = $('pName');
    const errEl = $('errPName');
    const newName = nameInput.value.trim();

    // Client validation
    if (!newName) {
      setFieldError(nameInput, errEl, 'Họ và tên không được để trống');
      return;
    }
    setFieldError(nameInput, errEl, '');

    const btn = $('btnSaveName');
    setButtonLoading(btn, true, 'Đang lưu...');

    try {
      const u = await api('/api/users/me', { method: 'PUT', body: { fullName: newName } });
      $('pDisplayName').textContent = u.fullName;
      const newInitial = (u.fullName || u.username || 'U').charAt(0).toUpperCase();
      $('pAvatar').textContent = newInitial;
      showToast('Đã lưu họ tên mới thành công!', 'success');
      showAlert(box, 'success', 'Đã lưu họ tên mới.');
      renderNav(u, 'profile');
    } catch (e) {
      showToast(errText(e), 'error');
      showAlert(box, 'error', errText(e));
    } finally {
      setButtonLoading(btn, false);
    }
  };

  // Luồng Form Đổi Mật Khẩu
  $('formPassword').onsubmit = async (ev) => {
    ev.preventDefault();
    const box = $('alertPass');
    hideAlert(box);

    const oldInput = $('oldPass');
    const newInput = $('newPass');
    const errOld = $('errOldPass');
    const errNew = $('errNewPass');

    const oldPass = oldInput.value;
    const newPass = newInput.value;
    let hasError = false;

    // Client validation
    if (!oldPass) {
      setFieldError(oldInput, errOld, 'Vui lòng nhập mật khẩu hiện tại');
      hasError = true;
    } else {
      setFieldError(oldInput, errOld, '');
    }

    if (!newPass) {
      setFieldError(newInput, errNew, 'Vui lòng nhập mật khẩu mới');
      hasError = true;
    } else if (newPass.length < 6) {
      setFieldError(newInput, errNew, 'Mật khẩu mới phải có tối thiểu 6 ký tự');
      hasError = true;
    } else {
      setFieldError(newInput, errNew, '');
    }

    if (hasError) return;

    const btn = $('btnPass');
    setButtonLoading(btn, true, 'Đang cập nhật...');

    try {
      const r = await api('/api/users/me/password', {
        method: 'PUT',
        body: { oldPassword: oldPass, newPassword: newPass }
      });
      oldInput.value = '';
      newInput.value = '';
      showToast('Đổi mật khẩu thành công!', 'success');
      showAlert(box, 'success', r.message);
    } catch (e) {
      showToast(errText(e), 'error');
      showAlert(box, 'error', errText(e));
    } finally {
      setButtonLoading(btn, false);
    }
  };
})();
