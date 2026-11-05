# GRANDMASTER ARENA - ĐẤU TRƯỜNG CỜ CARO TRỰC TUYẾN

Chào mừng bạn đến với **Grandmaster Arena** – Nền tảng thi đấu cờ Caro hiện đại, hỗ trợ đấu đơn với AI đa cấp độ, thi đấu 2 người cùng máy và phòng thi đấu trực tuyến thời gian thực giữa 2 thiết bị khác nhau qua mạng LAN / Wi-Fi.

Tài liệu này được viết theo phong cách **cầm tay chỉ việc**, giúp bất kỳ ai dù chưa từng lập trình cũng có thể tải về và khởi chạy game trơn tru trên máy tính của mình.

---

## 1. CÁC PHẦN MỀM CẦN CÀI ĐẶT TRƯỚC (CHỈ CẦN LÀM 1 LẦN)

Trước khi chạy dự án, hãy tải và cài đặt 3 phần mềm miễn phí sau:

1. **Java JDK 17 hoặc 21 trở lên**:
   - Tải bộ cài JDK từ Eclipse Adoptium (Temurin): [https://adoptium.net/](https://adoptium.net/)
   - Khi cài đặt, tích chọn **"Add to PATH"**.
2. **Node.js (Bản LTS - khuyên dùng 20.x hoặc 22.x)**:
   - Tải tại: [https://nodejs.org/](https://nodejs.org/)
   - Cứ bấm Next liên tục cho đến khi hoàn tất.
3. **XAMPP (Để chạy cơ sở dữ liệu MySQL)**:
   - Tải tại: [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - Cài đặt xong, mở **XAMPP Control Panel**, bấm nút **Start** ở dòng **MySQL**.

---

## 2. TẢI DỰ ÁN VỀ MÁY

Mở ứng dụng **Terminal / Command Prompt (CMD) / PowerShell** trên máy tính của bạn và gõ:

```bash
git clone https://github.com/kanchosama2006-cloud/Java_Tan_Nghiem.git caro
cd caro
```

*(Nếu không dùng Git, bạn có thể bấm nút **Code -> Download ZIP** màu xanh trên GitHub rồi giải nén vào ổ đĩa trên máy).*

---

## 3. CẤU HÌNH CƠ SỞ DỮ LIỆU (DATABASE)

Dự án sử dụng cơ sở dữ liệu MySQL tự động tạo bảng:

1. Mở trình duyệt web, truy cập vào trang quản lý cơ sở dữ liệu của XAMPP: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Bấm vào mục **Mới (New)** ở cột bên trái.
3. Nhập tên cơ sở dữ liệu là: `caro_db` và bấm **Tạo (Create)**.
4. Kiểm tra file cấu hình:
   - Mở file: `src/main/resources/application.properties`
   - Đảm bảo tài khoản đăng nhập MySQL khớp với máy bạn (mặc định của XAMPP là user: `root`, mật khẩu để trống `spring.datasource.password=`):
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/caro_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh&characterEncoding=UTF-8
   spring.datasource.username=root
   spring.datasource.password=
   ```

---

## 4. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

Dự án gồm 2 phần: **Backend (Máy chủ Java Spring Boot)** và **Frontend (Giao diện React Vite)**. Bạn chỉ cần mở 2 cửa sổ dòng lệnh riêng biệt:

### Bước 1: Khởi động Backend (Spring Boot Server)
Mở cửa sổ dòng lệnh thứ nhất tại thư mục dự án `caro`:

- **Nếu dùng IntelliJ IDEA hoặc Eclipse / VS Code**: Mở thư mục dự án và bấm nút **Run** tại file `CaroApplication.java`.
- **Hoặc nếu dùng lệnh Maven**:
  ```bash
  mvn spring-boot:run
  ```
Khi màn hình hiện dòng chữ `Started CaroApplication in ... seconds` và cổng `8080`, máy chủ backend đã sẵn sàng!

---

### Bước 2: Khởi động Frontend (Giao diện Người dùng)
Mở cửa sổ dòng lệnh thứ hai tại thư mục dự án `caro`:

```bash
# 1. Đi vào thư mục giao diện
cd frontend

# 2. Cài đặt các thư viện phụ thuộc (chỉ cần chạy lần đầu tiên)
npm install

# 3. Khởi động giao diện
npm run dev -- --host
```

Màn hình sẽ hiển thị đường link truy cập, ví dụ:
- Trên chính máy tính này: [http://localhost:5173](http://localhost:5173)
- Trên điện thoại hoặc máy tính thứ 2 (cùng Wi-Fi): `http://192.168.x.x:5173`

Mở trình duyệt lên và trải nghiệm ngay!

---

## 5. TÀI KHOẢN TRẢI NGHIỆM

Bạn có thể tự đăng ký một tài khoản mới trực tiếp trên giao diện hoặc sử dụng tài khoản có sẵn:
- **Tài khoản Người Chơi (Player)**:
  - Tên đăng nhập: `player`
  - Mật khẩu: `123456`
- **Tài khoản Quản Trị Viên (Admin)**:
  - Tên đăng nhập: `admin`
  - Mật khẩu: `admin123` (hoặc kiểm tra tài khoản có vai trò ADMIN trong bảng `users`)
  - Đường dẫn trang quản trị: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## 6. CÁC TÍNH NĂNG NỔI BẬT TRONG GAME

1. **Chế Độ Chơi Đa Dạng**:
   - **Đấu với AI**: 3 cấp độ (Tân Thủ, Chiến Binh, Đại Kiện Tướng).
   - **Đấu 2 Người Trên 1 Máy (Pass & Play)**: Chơi cùng bạn bè trên cùng màn hình.
   - **Chơi Online Trực Tuyến (2 Thiết Bị)**:
     - Tạo phòng thi đấu riêng kèm Mã Phòng (Room Code).
     - Đấu thủ thứ 2 chỉ cần nhập mã phòng để vào tham chiến.
     - Cơ chế gửi chiến thư, đếm ngược 3 giây chuẩn thi đấu và tự động xử thua nếu đối thủ chủ động rời phòng.
2. **Quy Mô Bàn Cờ Đa Kích Thước**:
   - Bàn cờ 3x3 (Tic-Tac-Toe giải trí).
   - Bàn cờ 10x10 (Chuẩn cờ Caro học đường - 5 quân liên tiếp).
   - Bàn cờ 15x15 & 20x20 (Chuẩn đấu trường chuyên nghiệp).
3. **Cửa Hàng Vật Phẩm & Skin Nghệ Thuật**:
   - Mua và trang bị Mặt Bàn Cờ (Đá Núi Lửa, Gỗ Hoàng Đàn, Ngọc Bích...).
   - Đổi kiểu dáng quân cờ X/O và khung avatar vương giả.
   - Tích hợp **Bộ pha màu kéo thả trực quan** tại trang Admin để tự tạo skin không giới hạn.
4. **Hệ Thống Thống Kê & Bảng Xếp Hạng**:
   - Ghi nhận lịch sử đấu, tỷ lệ thắng, huân chương và BXH các đại kiện tướng hàng đầu.

---

## 7. MỘT SỐ LỖI THƯỜNG GẶP & CÁCH KHẮC PHỤC

| Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Lỗi `Communications link failure` khi chạy backend** | MySQL chưa được bật hoặc sai mật khẩu | Mở XAMPP bấm **Start** MySQL; kiểm tra lại user/password trong `application.properties`. |
| **Trang web báo lỗi "Không thể kết nối máy chủ"** | Backend chưa khởi động xong | Hãy đảm bảo cửa sổ Backend đang chạy trên cổng `8080` trước khi thao tác trên web. |
| **Thiết bị thứ 2 không mở được web qua IP** | Tường lửa Windows (Firewall) chặn cổng 5173/8080 | Mở Windows Defender Firewall, tạm thời tắt hoặc thêm ngoại lệ cho phép cổng 5173 và 8080. |
