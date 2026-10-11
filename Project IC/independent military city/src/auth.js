import { supabase } from './config.js';

/**
 * Kiểm tra định dạng email cơ bản
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Hàm xử lý đăng ký cư dân mới
 */
export async function registerNewResident(email, password, fullName) {
    try {
        // 1. Chuẩn hóa & kiểm tra đầu vào
        const safeName = (typeof fullName === 'string') ? fullName.trim() : '';
        const safeEmail = (typeof email === 'string') ? email.trim().toLowerCase() : '';
        const safePassword = (typeof password === 'string') ? password : '';

        if (!safeEmail || !isValidEmail(safeEmail)) {
            return {
                success: false,
                status: 'INVALID_EMAIL',
                message: 'Email không hợp lệ.'
            };
        }

        if (!safeName) {
            return {
                success: false,
                status: 'INVALID_NAME',
                message: 'Tên cư dân không được để trống.'
            };
        }

        if (!safePassword || safePassword.length < 6) {
            return {
                success: false,
                status: 'INVALID_PASSWORD',
                message: 'Mật khẩu phải có ít nhất 6 ký tự.'
            };
        }

        // 2. Gọi Supabase Auth để đăng ký
        const { data, error } = await supabase.auth.signUp({
            email: safeEmail,
            password: safePassword,
            options: {
                data: {
                    full_name: safeName
                }
            }
        });

        // 3. Xử lý lỗi từ Supabase
        if (error) {
            const msg = (error.message || '').toLowerCase();
            const code = error.code || '';

            // Email đã tồn tại (bắt chặt hơn, không dùng 422 một mình)
            if (
                code === 'email_exists' ||
                code === 'user_already_exists' ||
                msg.includes('already registered') ||
                msg.includes('user already registered') ||
                msg.includes('email address has already been registered')
            ) {
                return {
                    success: false,
                    status: 'EMAIL_ALREADY_EXISTS',
                    message: 'Email này đã được đăng ký trong thành phố.'
                };
            }

            // Giới hạn dân số (nếu backend có trigger)
            if (error.status === 400 && msg.includes('giới hạn')) {
                return {
                    success: false,
                    status: 'CITY_LIMIT_REACHED',
                    message: 'Thành phố đã đạt giới hạn cư dân tối đa.'
                };
            }

            // Các lỗi validation còn lại
            return {
                success: false,
                status: 'VALIDATION_ERROR',
                message: error.message || 'Dữ liệu đăng ký không hợp lệ.'
            };
        }

        // 4. Xử lý trường hợp Supabase trả về user giả (email đã tồn tại + Confirm email bật)
        if (data?.user) {
            if (data.user.identities && data.user.identities.length === 0) {
                return {
                    success: false,
                    status: 'EMAIL_ALREADY_EXISTS_MITIGATED',
                    message: 'Email này đã tồn tại trên hệ thống.'
                };
            }

            // Đăng ký thành công và có session ngay
            if (data.session) {
                return {
                    success: true,
                    status: 'SIGNED_IN',
                    message: 'Đăng ký thành công! Đang đưa bạn vào nội thành...',
                    session: data.session,
                    user: data.user
                };
            }

            // Đăng ký thành công nhưng cần xác nhận email
            return {
                success: true,
                status: 'AWAITING_EMAIL_CONFIRMATION',
                message: 'Đăng ký hoàn tất! Vui lòng kiểm tra email để kích hoạt tài khoản.'
            };
        }

        return {
            success: false,
            status: 'UNKNOWN_RESPONSE',
            message: 'Hệ thống Auth phản hồi không xác định.'
        };

    } catch (error) {
        console.error('Lỗi hệ thống khi đăng ký:', error);

        const isNetworkError =
            error.message?.includes('fetch') ||
            error.message?.includes('network') ||
            error.message?.includes('Failed to fetch');

        return {
            success: false,
            status: isNetworkError ? 'NETWORK_ERROR' : 'SYSTEM_ERROR',
            message: isNetworkError
                ? 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.'
                : (error.message || 'Đã xảy ra lỗi hệ thống.')
        };
    }
}

/**
 * Hàm xử lý đăng nhập vào thành phố
 */
export async function loginToCity(email, password) {
    try {
        const safeEmail = (typeof email === 'string') ? email.trim().toLowerCase() : '';
        const safePassword = (typeof password === 'string') ? password : '';

        if (!safeEmail || !isValidEmail(safeEmail)) {
            return {
                success: false,
                status: 'INVALID_EMAIL',
                message: 'Email không hợp lệ.'
            };
        }

        if (!safePassword) {
            return {
                success: false,
                status: 'INVALID_PASSWORD',
                message: 'Mật khẩu không được để trống.'
            };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: safeEmail,
            password: safePassword
        });

        if (error) {
            return {
                success: false,
                status: 'LOGIN_FAILED',
                message: error.message || 'Email hoặc mật khẩu không đúng.'
            };
        }

        if (data?.session) {
            return {
                success: true,
                status: 'LOGIN_SUCCESS',
                message: 'Đăng nhập thành công!',
                session: data.session,
                user: data.user
            };
        }

        return {
            success: false,
            status: 'UNKNOWN_RESPONSE',
            message: 'Phản hồi đăng nhập không hợp lệ.'
        };

    } catch (error) {
        console.error('Lỗi hệ thống khi đăng nhập:', error);

        return {
            success: false,
            status: 'SYSTEM_ERROR',
            message: error.message || 'Đã xảy ra lỗi hệ thống khi đăng nhập.'
        };
    }
}