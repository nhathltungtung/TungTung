# Quy Chuẩn Lập Kế Hoạch & Làm Rõ Nghiệp Vụ (Planning & Business Clarification Protocol)

> **Mục đích**: Đảm bảo AI Agent (Antigravity) luôn đồng thuận với người dùng về mặt kiến trúc, giải pháp và logic nghiệp vụ trước khi can thiệp vào mã nguồn, tránh việc tự suy diễn sai lệch hoặc tự ý sửa code mà không có sự kiểm soát của người dùng.

---

## 🛑 1. Bắt Buộc Dừng Lại Khi Tạo Kế Hoạch (Planning Mode & Execution Gate)

- Khi nhận được yêu cầu tính năng mới, thay đổi kiến trúc, refactor lớn, hoặc thay đổi có tính phức tạp:
  1. Agent tiến hành khảo sát, tìm hiểu codebase (chỉ dùng các công cụ đọc: `view_file`, `grep_search`, `list_dir`). Tuyệt đối **KHÔNG** chỉnh sửa file hoặc chạy lệnh thay đổi mã nguồn trong bước này.
  2. Tạo hoặc cập nhật tài liệu kế hoạch (`implementation_plan.md` hoặc trình bày các bước cụ thể).
  3. **BẮT BUỘC DỪNG LẠI (STOP execution)**: Kết thúc lượt phản hồi (turn) mà **KHÔNG gọi thêm tool sửa code nào**, chờ người dùng xem xét, thảo luận và bấm chấp thuận (`Proceed` / duyệt kế hoạch).
  4. Chỉ khi người dùng phản hồi đồng ý hoặc chỉ đạo tiếp tục, Agent mới được phép tiến hành viết code.

---

## ❓ 2. Bắt Buộc Dừng Lại Khi Có Câu Hỏi Nghiệp Vụ (Business Logic Clarification)

- Khi gặp các vấn đề chưa rõ ràng về nghiệp vụ, ví dụ:
  - Luồng xử lý quy trình kinh doanh (Business Workflow, Trạng thái đơn hàng, Phân quyền User / Role).
  - Quy tắc xác thực dữ liệu đặc thù (Validation rules, Định dạng trường, Ràng buộc nghiệp vụ).
  - Cách xử lý các trường hợp ngoại lệ hoặc dữ liệu cũ (Edge cases, Backward compatibility).
  - Ý định thiết kế giao diện hoặc trải nghiệm người dùng (UX preferences).
- **Quy tắc bất khả xâm phạm**:
  - **TUYỆT ĐỐI KHÔNG TỰ Ý SUY DIỄN HOẶC TỰ CODE THEO GIẢ ĐỊNH CHỦ QUAN**.
  - Đặt câu hỏi rõ ràng, gãy gọn cho người dùng (có thể dùng tool `ask_question` với các phương án lựa chọn khi phù hợp, hoặc đặt câu hỏi trực tiếp trong chat).
  - **BẮT BUỘC DỪNG LẠI (STOP)** và chờ người dùng trả lời câu hỏi nghiệp vụ trước khi tiếp tục.

---

## 🛡️ 3. Quy Tắc Kiểm Soát Mã Nguồn (Code Guard)

1. **Không sửa code khi plan chưa được duyệt**: Mọi file `app/`, `components/`, `lib/`, `supabase/` đều được bảo vệ; chỉ can thiệp sau khi có sự đồng ý của người dùng.
2. **Hỏi trước - Code sau**: Nếu có điểm nghi ngờ giữa hai giải pháp kỹ thuật hoặc nghiệp vụ, luôn đưa ra các phương án (Options A, B, C) kèm ưu/nhược điểm và chờ người dùng chọn.
3. **Phản hồi súc tích, minh bạch**: Sau khi kế hoạch được duyệt hoặc câu hỏi được giải đáp, Agent thực thi theo đúng phạm vi đã thống nhất, không tự ý thêm các tính năng ngoài thỏa thuận.
