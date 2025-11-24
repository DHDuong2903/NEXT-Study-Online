# Stuline

Stuline là nền tảng học trực tuyến hiện đại, phát triển với Next.js (frontend) và Convex (backend), sử dụng Clerk xác thực, Stream cho video call, TailwindCSS, Radix UI. Dự án hướng tới trải nghiệm học tập tối ưu, bảo mật, dễ mở rộng và quản trị.

## Kiến trúc dự án

- Monorepo gồm hai phần:
  - `frontend`: Next.js, TypeScript, TailwindCSS, Radix UI
  - `backend`: Convex (serverless database & functions)
- Xác thực người dùng với Clerk
- Video call, ghi hình qua Stream
- Quản lý trạng thái frontend bằng hooks, context
- Giao tiếp backend qua Convex API

## Tính năng chính

- Đăng nhập/đăng ký bảo mật qua Clerk
- Quản lý người dùng, phân quyền học sinh/giáo viên, đồng bộ user qua webhook
- Quản lý phòng học, cuộc gọi trực tuyến (tạo, tham gia, lên lịch, kết thúc, xóa phòng)
- Lên lịch lớp học với lựa chọn thời gian, giáo viên, học sinh
- Tham gia phòng học qua link hoặc ID, hiển thị danh sách người tham gia
- Điều khiển cuộc gọi: bật/tắt mic/cam, chuyển layout (grid/speaker), kết thúc cuộc gọi
- Ghi hình buổi học, lưu trữ và xem lại recordings
- Trình soạn thảo mã (CodeEditor): luyện tập coding, chạy mã JS/Python, kiểm tra test case
- Quản lý câu hỏi lập trình: thêm/sửa/xóa, ví dụ, starter code cho JS/Python, phân loại độ khó
- Bình luận, giải đáp trực tiếp trong phòng học và trên câu hỏi
- Quick Actions trên trang chủ: New Call, Join Room, Schedules, Recordings, Coding Questions
- Trang quản trị cho admin: thống kê số lượng người dùng, câu hỏi, lớp học, hiển thị bảng và biểu đồ
- Tìm kiếm, lọc, phân trang danh sách câu hỏi, người dùng, phòng học

## Cài đặt nhanh

### Yêu cầu hệ thống

- Node.js >= 18.x
- Tài khoản Clerk, Stream, Convex

### Các bước cài đặt

```bash
git clone https://github.com/DHDuong2903/NEXT-Study-Online.git
cd study-online
npm install
```

Tạo file `.env.local` theo mẫu, điền các thông tin API key cho Clerk, Stream, Convex.

### Khởi động

```bash
npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000)

## Công nghệ sử dụng

- Frontend: Next.js, TypeScript, Clerk, TailwindCSS, Radix UI, Convex, Stream
- Backend: Convex (serverless), Stream (video call), Clerk (auth)
