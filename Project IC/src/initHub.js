import { supabase } from './config.js';
import { purchaseProduct, getWalletBalance } from './market.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userNameLabel = document.getElementById('user-name');
    const userBalanceLabel = document.getElementById('user-balance');
    const btnLogout = document.getElementById('btn-logout');
    const hubMessageBox = document.getElementById('hub-message');
    const marketContainer = document.getElementById('market-container');

    /**
     * Hàm hiển thị thông báo trạng thái khu nội thành
     */
    function showHubNotification(text, isError = true) {
        hubMessageBox.textContent = text;
        hubMessageBox.className = isError
            ? "p-4 rounded-lg text-center font-medium text-sm shadow-md bg-rose-950 text-red-400 border border-rose-900"
            : "p-4 rounded-lg text-center font-medium text-sm shadow-md bg-emerald-950 text-emerald-400 border border-emerald-800";
        hubMessageBox.classList.remove('hidden');
    }

    // 1. KIỂM TRA TRẠNG THÁI: Tải thông tin danh tính và ví AD thực tế của cư dân
    async function loadResidentData() {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            // Nếu chưa đăng nhập bậy bạ vào, đá bay về cổng thành index.html
            window.location.href = './index.html';
            return;
        }

        // Hiện email cư dân làm thông tin danh tính tạm thời cho V1
        userNameLabel.textContent = user.email;

        // Gọi hàm hốt số dư ví từ market.js
        const wallet = await getWalletBalance();
        if (wallet.success) {
            userBalanceLabel.textContent = wallet.balance;
        } else {
            showHubNotification(wallet.message, true);
        }
    }

    // 2. SỰ KIỆN ĐĂNG XUẤT: Rời thành phố an toàn
    btnLogout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        alert("Ông bạn đã rời thành phố an toàn. Hẹn gặp lại!");
        window.location.href = './index.html';
    });

    // 3. ĐÁP ỨNG ĐIỀU 4 & 5: Treo bảng báo chưa triển khai cho hệ thống Menu/Ví chi tiết
    const navLinks = document.querySelectorAll('nav a, aside a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === '#') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showHubNotification(`Tính năng "${link.textContent}" thuộc phạm vi mở rộng, hiện chưa được triển khai ở bản V1 này!`, true);
            });
        }
    });

    // 4. MÔI TRƯỜNG MẪU: Đổ sản phẩm giả lập lên chợ để chuẩn bị test nút "Mua ngay"
    // (Vì Backend chưa làm luồng đăng sản phẩm, ta render mẫu 1 item để test mạch điện)
    function renderTestProduct() {
        marketContainer.innerHTML = `
            <div class="bg-slate-950 p-4 rounded-lg border border-slate-700 space-y-3">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-sm text-slate-200">Rìu Cựu Binh Independence</h4>
                    <span class="text-xs font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded">100 AD</span>
                </div>
                <p class="text-xs text-slate-400">Vũ khí thô sơ bảo vệ sạp hàng, giá trị gốc từ database.</p>
                <!-- NÚT MUA MANG ID GIẢ LẬP TRÙNG VỚI MÃ CỦA BÀI TEST PYTHON V3 -->
                <button class="btn-buy-now w-full bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs py-2 px-3 rounded transition"
                        data-product-id="11111111-1111-1111-1111-111111111111">
                    Mua Ngay Bằng Tiền ẢO
                </button>
            </div>
        `;

        // Đấu dây điện cho nút Mua ngay vừa render
        const btnBuy = marketContainer.querySelector('.btn-buy-now');
        btnBuy.addEventListener('click', async () => {
            hubMessageBox.classList.add('hidden');
            const productId = btnBuy.getAttribute('data-product-id');
            
            btnBuy.disabled = true;
            btnBuy.textContent = "Hệ thống đang hoán đổi tiền...";

            const result = await purchaseProduct(productId);
            if (result.success) {
                showHubNotification(result.message, false);
            } else {
                showHubNotification(result.message, true);
                btnBuy.disabled = false;
                btnBuy.textContent = "Mua Ngay Bằng Tiền ẢO";
            }
        });
    }

    // Chạy kích hoạt toàn bộ hệ thống nội thành
    await loadResidentData();
    renderTestProduct();
});
