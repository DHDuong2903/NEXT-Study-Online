# Stuline Web

Stuline là một ứng dụng web học trực tuyến hiện đại sử dụng Next.js (App Router) + Convex + Stream Video + Clerk.  
Dự án hỗ trợ: đăng nhập bằng Clerk, cuộc gọi trực tuyến (tạo, tham gia, lên lịch, ghi hình) với GetStream, soạn thảo/chạy mã JS/Python, quản lý câu hỏi, Quick Actions, webhook đồng bộ người dùng.

## Cấu trúc thư mục

```
study-online/
│
├── convex/         # Convex backend (queries/mutations, HTTP routes, Clerk webhook)
│   ├── http.ts     # Webhook Clerk qua Convex HTTP router
│   ├── rooms.ts    # Logic rooms/cuộc gọi: getMyRooms, updateRoomStatus, deleteRoom, ...
│   ├── users.ts    # Đồng bộ user từ Clerk
│   └── questions.ts# CRUD câu hỏi lập trình
├── src/            # Ứng dụng Next.js (App Router)
│   ├── app/
│   │   ├── layout.tsx                          # Bọc Convex+Clerk providers
│   │   ├── (root)/layout.tsx                   # Bọc Stream Client Provider
│   │   ├── (root)/(home)/page.tsx              # Trang chủ + Quick Actions
│   │   ├── (root)/meetings/[id]/page.tsx       # Trang cuộc gọi
│   │   ├── (root)/recordings/page.tsx          # Danh sách ghi hình
│   │   └── (root)/schedules/MeetingScheduleUI.tsx # Lên lịch học
│   ├── actions/stream.actions.ts               # Tạo token user cho Stream (server action)
│   ├── components/
│   │   ├── providers/StreamClientProvider.tsx  # Khởi tạo Stream Video client phía client
│   │   ├── MeetingSetup.tsx                    # Tiền phòng: bật/tắt mic/cam, join
│   │   ├── MeetingRoom.tsx                     # Giao diện phòng: layout, controls, participants, CodeEditor
│   │   ├── EndCallButton.tsx                   # Kết thúc cuộc gọi + cập nhật Convex
│   │   └── RecordingCard.tsx                   # Thẻ ghi hình
│   ├── hooks/
│   │   ├── useMeetingActions.ts                # Tạo nhanh/Tham gia cuộc gọi
│   │   ├── useGetCalls.ts                      # Truy vấn danh sách cuộc gọi
│   │   └── useGetCallById.ts                   # Truy vấn cuộc gọi theo id
│   ├── constants/index.ts                      # QUICK_ACTIONS, TIME_SLOTS, ...
│   └── components/CodeEditor.tsx               # Trình soạn thảo & chạy JS/Python
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

Tham khảo nhanh file/symbol:
- GetStream client & token: [`StreamClientProvider`](src/components/providers/StreamClientProvider.tsx), [`streamTokenProvider`](src/actions/stream.actions.ts)
- Tạo/Tham gia cuộc gọi: [`useMeetingActions.createInstantMeeting`](src/hooks/useMeetingActions.ts), [`useMeetingActions.joinMeeting`](src/hooks/useMeetingActions.ts), [src/app/(root)/(home)/page.tsx](src/app/%28root%29/%28home%29/page.tsx)
- Trang cuộc gọi: [src/app/(root)/meetings/[id]/page.tsx](src/app/%28root%29/meetings/%5Bid%5D/page.tsx), [`MeetingSetup`](src/components/MeetingSetup.tsx), [`MeetingRoom`](src/components/MeetingRoom.tsx), [`EndCallButton`](src/components/EndCallButton.tsx)
- Ghi hình: [src/app/(root)/recordings/page.tsx](src/app/%28root%29/recordings/page.tsx), [`useGetCalls`](src/hooks/useGetCalls.ts), [`RecordingCard`](src/components/RecordingCard.tsx)
- Convex rooms: [`rooms.getMyRooms`](convex/rooms.ts), [`rooms.getRoomByStreamCallId`](convex/rooms.ts), [`rooms.updateRoomStatus`](convex/rooms.ts), [`rooms.deleteRoom`](convex/rooms.ts)
- Câu hỏi coding: [`questions.createQuestion`](convex/questions.ts), [`CodeEditor`](src/components/CodeEditor.tsx)
- Webhook Clerk: [convex/http.ts](convex/http.ts), đồng bộ user: [`users.syncUser`](convex/users.ts)

## Yêu cầu hệ thống

- Node.js >= 18.x
- Convex CLI
- Trình duyệt hỗ trợ WASM (Pyodide cho Python)
- Tài khoản:
  - Clerk (xác thực)
  - GetStream (Stream Video: API Key + Secret)

## Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone <repo-url>
cd study-online
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
pnpm install
```

### 3. Thiết lập biến môi trường

Tạo file `.env.local` tại thư mục gốc:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Convex (dev server mặc định chạy cổng 3210)
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# GetStream (Stream Video)
NEXT_PUBLIC_STREAM_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
```

Ghi chú Webhook Clerk:
- Dev: trỏ tới Convex dev server: http://127.0.0.1:3210/clerk-webhook
- Prod: https://<your-convex-deployment>.convex.site/clerk-webhook
- Xác minh chữ ký Svix xử lý trong [convex/http.ts](convex/http.ts)

### 4. Seed dữ liệu mẫu (tuỳ chọn)

Không yêu cầu seed. Câu hỏi có thể thêm qua UI: [`AddNewQuestionButton`](src/components/AddNewQuestionButton.tsx).

### 5. Khởi động dự án

Chạy Convex (cửa sổ 1):

```bash
npx convex dev
```

Chạy Next.js (cửa sổ 2):

```bash
npm run dev
# hoặc
pnpm dev
```

Truy cập: http://localhost:3000

## Tính năng chính

- Cuộc gọi trực tuyến với GetStream:
  - Tạo cuộc gọi ngay (Instant Meeting)
  - Tham gia bằng ID/phòng
  - Lên lịch lớp học (Schedules)
  - Ghi hình và xem lại (Recordings)
  - Điều khiển mic/cam, layout, danh sách người tham gia
  - Kết thúc cuộc gọi và đồng bộ trạng thái phòng lên Convex
- Luyện tập lập trình:
  - Trình soạn thảo mã Monaco, chạy JS (Web Worker) và Python (Pyodide/WASM)
  - So sánh kết quả với test cases (PASS/FAIL), hiển thị console output
  - Quản lý câu hỏi: thêm/sửa, ví dụ, starter code cho JS/Python
- Quick Actions trên trang chủ: New Call, Join Room, Schedules, Recordings, Coding Questions
- Webhook Clerk đồng bộ sự kiện người dùng sang Convex

## Luồng cuộc gọi trực tuyến (GetStream)

1) Khởi tạo client và cấp token  
   - Phần client: [`StreamClientProvider`](src/components/providers/StreamClientProvider.tsx) bọc trong [src/app/(root)/layout.tsx](src/app/%28root%29/layout.tsx).  
     Tạo `StreamVideoClient` với `NEXT_PUBLIC_STREAM_KEY` và `tokenProvider`.
   - Cấp token server-side: [`streamTokenProvider`](src/actions/stream.actions.ts) dùng `StreamClient` (server SDK) để sinh token theo `user.id`.

2) Tạo cuộc gọi tức thì (Instant Meeting)  
   - Hook: [`useMeetingActions.createInstantMeeting`](src/hooks/useMeetingActions.ts)
     - Tạo `id = crypto.randomUUID()`
     - `client.call("default", id).getOrCreate({ data: { starts_at, custom: { description }}})`
     - Điều hướng tới `/meetings/{id}`
   - Kích hoạt từ Quick Action “New Call” trên [src/app/(root)/(home)/page.tsx](src/app/%28root%29/%28home%29/page.tsx).

3) Tham gia cuộc gọi  
   - Hook: [`useMeetingActions.joinMeeting`](src/hooks/useMeetingActions.ts) điều hướng `/meetings/{id}`.
   - Trang: [src/app/(root)/meetings/[id]/page.tsx](src/app/%28root%29/meetings/%5Bid%5D/page.tsx) tải call qua [`useGetCallById`](src/hooks/useGetCallById.ts).
   - Tiền phòng: [`MeetingSetup`](src/components/MeetingSetup.tsx) cho bật/tắt mic/cam và `call.join()`.

4) Trong phòng gọi  
   - Giao diện phòng: [`MeetingRoom`](src/components/MeetingRoom.tsx) với layout (grid/speaker), controls, participants.  
     Tích hợp trình soạn thảo mã: [`CodeEditor`](src/components/CodeEditor.tsx) hiển thị trong layout.
   - Kết thúc cuộc gọi (chủ phòng): [`EndCallButton`](src/components/EndCallButton.tsx) gọi `call.endCall()` và cập nhật Convex qua [`rooms.updateRoomStatus`](convex/rooms.ts).

5) Ghi hình và xem lại  
   - Trang: [src/app/(root)/recordings/page.tsx](src/app/%28root%29/recordings/page.tsx).  
     Lấy danh sách calls bằng [`useGetCalls`](src/hooks/useGetCalls.ts) rồi `call.queryRecordings()`.  
     Hiển thị bằng [`RecordingCard`](src/components/RecordingCard.tsx).

6) Lên lịch lớp học  
   - UI: [src/app/(root)/schedules/MeetingScheduleUI.tsx](src/app/%28root%29/schedules/MeetingScheduleUI.tsx).  
     Sử dụng `useStreamVideoClient` và `TIME_SLOTS` từ [src/constants/index.ts](src/constants/index.ts) để tạo các cuộc gọi theo lịch.

7) Quản lý phòng/cuộc gọi trong Convex  
   - Truy vấn/điều khiển phòng: [`rooms.getMyRooms`](convex/rooms.ts), [`rooms.getRoomByStreamCallId`](convex/rooms.ts), [`rooms.updateRoomStatus`](convex/rooms.ts), [`rooms.deleteRoom`](convex/rooms.ts).  
     Quyền xóa phòng chỉ dành cho teacher của phòng (xem logic trong [convex/rooms.ts](convex/rooms.ts)).

## Công nghệ sử dụng

- Frontend: Next.js (App Router), React, shadcn/ui, lucide-react, monaco-editor, Tailwind CSS
- Backend: Convex (queries/mutations, HTTP routes), tích hợp Clerk
- Realtime/Video: Stream Video (GetStream)
- Xác thực: Clerk
- Chạy mã: Web Worker (JS), Pyodide/WASM (Python)
- Thông báo: sonner