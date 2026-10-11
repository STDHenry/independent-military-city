import { supabase } from './config.js';

/**
 * Hàm xử lý mua hàng nguyên tử (Atomic) dưới Database
 * @param {string} productId - ID (UUID) của sản phẩm cần mua
 */
export async function purchaseProduct(productId) {
    try {
        // Kiểm tra định dạng UUID cơ bản tại frontend trước khi gửi lên mạng
        if (typeof productId !== 'string' || !productId.trim()) {
            return {
                success: false,
                status: 'INVALID_PRODUCT_ID',
                message: 'Mã sản phẩm đầu vào không hợp lệ hoặc bị trống.'
            };
        }

        // Gọi hàm V3 siêu bảo mật dưới database, chỉ truyền duy nhất product_id
        // Toàn bộ logic kiểm tra số dư, kiểm tra trạng thái AVAILABLE đều xử lý dưới lõi DB
        const { data, error } = await supabase.rpc('buy_product_v3', {
            target_product_id: productId.trim()
        });

        // 1. BẪY LỖI: Phát hiện lỗi phản hồi từ hệ thống hoặc lỗi do lệnh RAISE EXCEPTION từ lõi DB bắn lên
        if (error) {
            const errorMsg = (error.message || '').toLowerCase();
            
            // Lỗi 1: Người mua không đủ tiền ảo AD
            if (errorMsg.includes('số dư ví ad không đủ')) {
                return {
                    success: false,
                    status: 'INSUFFICIENT_FUNDS',
                    message: 'Số dư ví AD của ông bạn không đủ để thực hiện giao dịch này.'
                };
            }

            // Lỗi 2: Sản phẩm đã bị mua mất hoặc bị ẩn (Không còn AVAILABLE)
            if (errorMsg.includes('không còn sẵn')) {
                return {
                    success: false,
                    status: 'PRODUCT_NOT_AVAILABLE',
                    message: 'Món đồ này đã bị người khác mua mất rồi hoặc đã bị ẩn khỏi chợ.'
                };
            }

            // Lỗi 3: Người dùng tự mua đồ của chính mình rao bán
            if (errorMsg.includes('chính mình')) {
                return {
                    success: false,
                    status: 'SELF_PURCHASE_FORBIDDEN',
                    message: 'Luật thành phố chặn hành vi tự mua sản phẩm của chính mình rao bán!'
                };
            }

            // Lỗi 4: Không tìm thấy tài khoản ví (NULL) hoặc sản phẩm không tồn tại
            if (errorMsg.includes('không tìm thấy') || errorMsg.includes('không tồn tại')) {
                return {
                    success: false,
                    status: 'RECORD_NOT_FOUND',
                    message: 'Dữ liệu không hợp lệ: Không tìm thấy sản phẩm hoặc tài khoản ví.'
                };
            }

            // Các lỗi phát sinh khác từ Database hoặc quyền EXECUTE bị chặn
            return {
                success: false,
                status: 'DATABASE_EXECUTION_ERROR',
                message: error.message || 'Giao dịch database thất bại.'
            };
        }

        // 2. BẪY LỖI: Trường hợp kết nối thành công nhưng kết quả xử lý của RPC báo tạch
        if (data && data.success === false) {
            return {
                success: false,
                status: 'TRANSACTION_REJECTED',
                message: data.error || 'Giao dịch bị hệ thống từ chối.'
            };
        }

        // 3. GIAO DỊCH THÀNH CÔNG HOÀN HẢO
        if (data && data.success === true) {
            return {
                success: true,
                status: 'PURCHASE_SUCCESS',
                message: 'Giao dịch thành công! Sản phẩm đã thuộc về quyền sở hữu của ông bạn.',
                response: data
            };
        }

        throw new Error("Hệ thống Chợ phản hồi trạng thái không xác định.");

    } catch (error) {
        // Phân loại lỗi kết nối mạng tổng quát (Tương tự except Exception trong Python)
        console.error('Hệ thống giao dịch Chợ AD gặp sự cố:', error);
        
        const isNetworkError =
            error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('Failed to fetch');

        return {
            success: false,
            status: isNetworkError ? 'NETWORK_ERROR' : 'SYSTEM_ERROR',
            message: isNetworkError
                ? 'Không thể kết nối tới máy chủ Chợ. Vui lòng kiểm tra mạng.'
                : (error.message || 'Đã xảy ra lỗi hệ thống khi giao dịch.')
        };
    }
}

/**
 * Hàm lấy số dư ví thực tế từ Database để hiển thị lên giao diện Hub
 */
export async function getWalletBalance() {
    try {
        // Lấy danh tính User đang đăng nhập thực tế từ token session để đảm bảo an toàn danh tính
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { 
                success: false, 
                status: 'UNAUTHENTICATED', 
                balance: 0,
                message: 'Vui lòng đăng nhập để kiểm tra ví.'
            };
        }

        // Quét bảng wallets lấy số dư thực tế dưới database
        const { data, error } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        return {
            success: true,
            status: 'FETCH_BALANCE_SUCCESS',
            balance: (data && typeof data.balance === 'number') ? data.balance : 0
        };

    } catch (error) {
        console.error('Không thể đọc số dư ví AD từ database:', error);
        return {
            success: false,
            status: 'DATABASE_ERROR',
            balance: 0,
            message: error.message || 'Lỗi kết nối database khi tải số dư ví.'
        };
    }
}
