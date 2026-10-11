import { registerNewResident, loginToCity } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Đấu nối các linh kiện giao diện qua ID chuẩn
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const fullNameInput = document.getElementById('auth-fullname');
    const nameGroup = document.getElementById('name-group');
    const btnAction = document.getElementById('btn-action');
    const linkToggle = document.getElementById('link-toggle');
    const messageBox = document.getElementById('auth-message');

    let currentMode = 'LOGIN'; // Mặc định mở trang là chế độ Đăng nhập

    /**
     * Hàm in thông báo động lên giao diện (Chống alert() rác theo Điều 2)
     */
    function displayStatus(text, type = 'error') {
        messageBox.textContent = text;
        if (type === 'success') {
            messageBox.className = "mb-4 p-3 rounded text-sm text-center font-medium bg-emerald-950 text-emerald-400 border border-emerald-800";
        } else if (type === 'info') {
            messageBox.className = "mb-4 p-3 rounded text-sm text-center font-medium bg-slate-950 text-amber-400 border border-amber-800 animate-pulse";
        } else {
            messageBox.className = "mb-4 p-3 rounded text-sm text-center font-medium bg-rose-950 text-red-400 border border-rose-900";
        }
        messageBox.classList.remove('hidden');
    }

    // 2. SỰ KIỆN 1: Chuyển đổi qua lại giữa Form Đăng nhập và Đăng ký
    linkToggle.addEventListener('click', (e) => {
        e.preventDefault();
        messageBox.classList.add('hidden');

        if (currentMode === 'LOGIN') {
            currentMode = 'REGISTER';
            nameGroup.classList.remove('hidden'); // Hiện ô nhập tên
            btnAction.textContent = "Xin Cấp Thị Thực Mới (Đăng Ký Cư Dân)";
            linkToggle.textContent = "Đã có tài khoản? Tiến vào thành phố (Đăng nhập)";
        } else {
            currentMode = 'LOGIN';
            nameGroup.classList.add('hidden'); // Ẩn ô nhập tên
            btnAction.textContent = "Tiến Vào Thành Phố (Đăng Nhập)";
            linkToggle.textContent = "Chưa có thị thực? Xin cấp cư dân mới (Đăng ký)";
        }
    });

    // 3. SỰ KIỆN 2: Bấm nút hành động chính (Nút màu Vàng)
    btnAction.addEventListener('click', async () => {
        messageBox.classList.add('hidden');
        
        const email = emailInput.value;
        const password = passwordInput.value;
        const fullName = fullNameInput.value;

        // Chặn người dùng bấm liên tục khi đang nghẽn mạng
        btnAction.disabled = true;
        const originalText = btnAction.textContent;
        btnAction.textContent = "Hệ thống đang kiểm tra...";

        if (currentMode === 'LOGIN') {
            const result = await loginToCity(email, password);
            if (!result.success) {
                displayStatus(result.message, 'error');
                btnAction.disabled = false;
                btnAction.textContent = originalText;
            }
            // Nếu đăng nhập thành công, auth.js của Grok sẽ tự nhảy sang hub.html
        } else {
            const result = await registerNewResident(email, password, fullName);
            
            if (result.success) {
                if (result.status === 'SIGNED_IN') {
                    displayStatus(result.message, 'success');
                } else {
                    displayStatus(result.message, 'info'); // Trạng thái chờ email xác nhận
                    passwordInput.value = ""; // Xóa mật mã bảo mật
                }
            } else {
                displayStatus(result.message, 'error');
            }
            
            btnAction.disabled = false;
            btnAction.textContent = originalText;
        }
    });
});
