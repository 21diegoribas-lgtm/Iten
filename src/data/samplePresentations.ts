import { PresentationItem } from '../types';

function createSampleSlide(title: string, subtitle: string, slideNum: number, total: number, bullets: string[], theme: 'sky' | 'amber' | 'emerald' | 'indigo'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const themes = {
    sky: { bg1: '#F0F9FF', bg2: '#E0F2FE', header: '#0284C7', accent: '#38BDF8', text: '#0F172A' },
    amber: { bg1: '#FFFBEB', bg2: '#FEF3C7', header: '#D97706', accent: '#F59E0B', text: '#1E1B4B' },
    emerald: { bg1: '#F0FDF4', bg2: '#DCFCE7', header: '#15803D', accent: '#22C55E', text: '#064E3B' },
    indigo: { bg1: '#EEF2FF', bg2: '#E0E7FF', header: '#4338CA', accent: '#6366F1', text: '#1E1B4B' }
  };

  const t = themes[theme] || themes.sky;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
  bgGrad.addColorStop(0, t.bg1);
  bgGrad.addColorStop(1, t.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // Decorative top bar
  ctx.fillStyle = t.header;
  ctx.fillRect(0, 0, 1920, 28);

  // Title Card Container
  ctx.fillStyle = '#FFFFFF';
  ctx.roundRect(90, 80, 1740, 920, 32);
  ctx.fill();

  // Border outline
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Slide Header
  ctx.font = '900 58px "Nunito", sans-serif';
  ctx.fillStyle = t.header;
  ctx.fillText(title, 150, 170);

  ctx.font = '700 32px "Nunito", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(subtitle, 150, 220);

  ctx.fillStyle = t.accent;
  ctx.fillRect(150, 245, 1620, 4);

  // Bullets
  let y = 340;
  bullets.forEach((b) => {
    // Bullet marker
    ctx.fillStyle = t.header;
    ctx.beginPath();
    ctx.arc(175, y - 12, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 38px "Nunito", sans-serif';
    ctx.fillStyle = t.text;
    ctx.fillText(b, 210, y);
    y += 90;
  });

  // Footer Slide counter
  ctx.font = '900 30px "Nunito", sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'right';
  ctx.fillText(`ITEN PRESENTATION • Slide ${slideNum} / ${total}`, 1770, 960);

  return canvas.toDataURL('image/png');
}

export function getInitialDemoPresentations(): PresentationItem[] {
  // Demo 1: Unit 8 - Cities of the Future
  const demo1Slides: string[] = [
    createSampleSlide('UNIT 8: CITIES OF THE FUTURE', 'Tiếng Anh 8 • Bài giảng điện tử tích hợp', 1, 6, [
      'Welcome to Unit 8: Smart & Sustainable Cities',
      'Learning Objectives: Vocabulary about urban tech & clean energy',
      'Grammar: Stative verbs & Future continuous tense',
      'Interactive Group Discussion & Q&A Activity'
    ], 'sky'),
    createSampleSlide('1. Key Vocabulary & Smart Infrastructure', 'Từ vựng trọng tâm về thành phố thông minh', 2, 6, [
      'Smart Grid: Mạng lưới điện thông minh',
      'Renewable Energy: Năng lượng tái tạo (Mặt trời, Gió)',
      'Urban Transport: Giao thông đô thị thông minh',
      'Eco-friendly Skyscraper: Tòa nhà cao tầng sinh thái'
    ], 'sky'),
    createSampleSlide('2. Renewable Energy Solutions', 'Giải pháp năng lượng xanh trong tương lai', 3, 6, [
      'Solar panels installed on all residential rooftops',
      'Wind turbines along coastal and high-altitude areas',
      'Zero-emission electric buses and automated trains',
      'Smart waste management and recycling algorithms'
    ], 'sky'),
    createSampleSlide('3. Grammar Focus: Future Continuous', 'Thì tương lai tiếp diễn: Will be + V-ing', 4, 6, [
      'Form: S + will be + V-ing + (at this time tomorrow...)',
      'Example: By 2030, people will be riding driverless taxis.',
      'Usage: Hành động đang xảy ra tại thời điểm xác định trong tương lai',
      'Practice Exercise: Điền dạng đúng của động từ vào chỗ trống'
    ], 'sky'),
    createSampleSlide('4. Discussion Task: Build Your Dream City', 'Hoạt động thảo luận nhóm & Thuyết trình', 5, 6, [
      'Work in groups of 4 students (10 minutes)',
      'Draw a mini blueprint of a future city concept',
      'List 3 key eco-friendly technologies used',
      'Present your group idea to the class!'
    ], 'sky'),
    createSampleSlide('5. Summary & Homework Assignment', 'Củng cố kiến thức & BTVN', 6, 6, [
      'Review all new vocabulary items in Student Book p.45',
      'Complete Workbook Unit 8 Exercises 1, 2, 3',
      'Prepare 2-minute speaking card for next lesson',
      'Thank you for participating actively in class!'
    ], 'sky')
  ];

  // Demo 2: Bài 15 - Khám phá Lịch sử & Địa lý 8
  const demo2Slides: string[] = [
    createSampleSlide('BÀI 15: KHÁM PHÁ LỊCH SỬ & ĐỊA LÝ 8', 'Bài giảng chuyên đề • Giáo dục Tích hợp ITEN', 1, 5, [
      'Chủ đề: Cuộc cách mạng công nghiệp lần thứ nhất và thứ hai',
      'Mục tiêu học tập: Nắm vững các phát minh lịch sử quan trọng',
      'Địa lý: Sự phát triển của các đô thị công nghiệp lớn trên thế giới',
      'Thảo luận & Đố vui tương tác cuối bài'
    ], 'amber'),
    createSampleSlide('1. Cuộc Cách Mạng Công Nghiệp Lần 1', 'Động cơ hơi nước & Ngành dệt vải', 2, 5, [
      'Phát minh máy hơi nước của James Watt (1784)',
      'Sự ra đời của tàu hỏa hơi nước và tàu thủy vỏ sắt',
      'Chuyển từ sản xuất thủ công sang cơ khí hóa hàng loạt',
      'Tác động xã hội: Sự hình thành giai cấp công nhân và tư sản'
    ], 'amber'),
    createSampleSlide('2. Cuộc Cách Mạng Công Nghiệp Lần 2', 'Năng lượng Điện, Động cơ đốt trong & Hóa chất', 3, 5, [
      'Máy phát điện và bóng đèn sợi đốt của Thomas Edison',
      'Dây chuyền sản xuất tự động hóa của Henry Ford',
      'Động cơ chạy bằng nhiên liệu xăng dầu',
      'Phát triển hạ tầng giao thông và viễn thông (Điện thoại, Điện báo)'
    ], 'amber'),
    createSampleSlide('3. Sự Thay Đổi Bản Đồ Địa Lý Kinh Tế', 'Quá trình đô thị hóa & Mở rộng thị trường', 4, 5, [
      'Sự bùng nổ dân số tại các trung tâm công nghiệp lớn',
      'Sự dịch chuyển dòng người từ nông thôn ra thành thị',
      'Sự ra đời của các hải cảng quốc tế và mạng lưới đường sắt',
      'Vấn đề môi trường và bài học phát triển bền vững'
    ], 'amber'),
    createSampleSlide('4. Tổng Kết & Bài Tập Về Nhà', 'Củng cố bài học & Ôn tập', 5, 5, [
      'Lập bảng so sánh Cách mạng Công nghiệp lần 1 và lần 2',
      'Trả lời 3 câu hỏi trắc nghiệm trong Sách giáo khoa trang 78',
      'Chuẩn bị cho trò chơi Rồng Cuốn Lên Mây tiết sau!',
      'Chúc các em học tốt!'
    ], 'amber')
  ];

  // Demo 3: Chủ đề STEM - Mô hình Xe đua Thông minh
  const demo3Slides: string[] = [
    createSampleSlide('STEM: THIẾT KẾ XE ĐƯA THÔNG MINH', 'Dự án Học tập Trải nghiệm • ITEN Innovation', 1, 4, [
      'Tổng quan dự án: Thiết kế và lắp ráp mô hình xe chạy năng lượng',
      'Kiến thức tích hợp: Vật lý (Lực ma sát, Vận tốc), Toán (Tỷ số truyền)',
      'Kỹ năng: Làm việc nhóm, Thiết kế kỹ thuật & Giải quyết vấn đề',
      'Thi đấu trực tiếp giữa các Tổ trên Đường đua ITEN!'
    ], 'emerald'),
    createSampleSlide('1. Nguyên Lý Động Lực Học Xe Đua', 'Vật lý & Cơ học ứng dụng', 2, 4, [
      'Giảm thiểu lực cản không khí (Khí động học 2.5D)',
      'Tối ưu hóa khối lượng và độ bám đường của bánh xe',
      'Tỷ số truyền bánh răng: Tăng tốc độ hay tăng lực kéo?',
      'An toàn và độ bền cấu trúc chassis xe'
    ], 'emerald'),
    createSampleSlide('2. Các Bước Thực Hiện Dự Án', 'Quy trình Kỹ thuật STEM 5 bước', 3, 4, [
      'Bước 1: Nghiên cứu nguyên lý & Phác thảo bản vẽ kỹ thuật',
      'Bước 2: Lựa chọn vật liệu tái chế (Bìa carton, Nắp chai, Động cơ)',
      'Bước 3: Lắp ráp mô hình và kiểm tra hệ thống truyền động',
      'Bước 4: Chạy thử nghiệm trên sa bàn và tinh chỉnh',
      'Bước 5: Thuyết trình sản phẩm & Tham gia Giải đua Lớp'
    ], 'emerald'),
    createSampleSlide('3. Tiêu Chí Đánh Giá Sản Phẩm', 'Bảng điểm Chuyên đề STEM', 4, 4, [
      'Tính sáng tạo & Thẩm mỹ mô hình: 30% tổng điểm',
      'Tốc độ và độ ổn định trên đường đua: 40% tổng điểm',
      'Kỹ năng thuyết trình & Trả lời phản biện: 30% tổng điểm',
      'Thưởng Sao Học Tập cho các đội xuất sắc nhất!'
    ], 'emerald')
  ];

  return [
    {
      id: 'demo_presentation_1',
      fileName: 'Unit_8_Cities_of_the_Future.pptx',
      title: 'Unit 8: Cities of the Future (Tiếng Anh 8)',
      teacherOwner: 'Cô Nguyễn Thị Mai',
      teacherId: 'teacher_1',
      uploadTime: '2026-09-01 08:30',
      updatedTime: '2026-09-01 08:30',
      format: 'pptx',
      fileSize: '3.8 MB',
      fileSizeBytes: 3984580,
      slideCount: 6,
      thumbnail: demo1Slides[0],
      slideImages: demo1Slides,
      status: 'ready',
      lastViewedSlide: 1,
      category: 'Tiếng Anh',
      subject: 'Tiếng Anh 8',
      description: 'Bài giảng điện tử về chủ đề Thành phố tương lai với cấu trúc từ vựng, ngữ pháp và bài tập nhóm.'
    },
    {
      id: 'demo_presentation_2',
      fileName: 'Bai_15_Lich_Su_Dia_Ly_8.pdf',
      title: 'Bài 15: Khám phá Lịch sử & Địa lý 8',
      teacherOwner: 'Thầy Trần Văn Minh',
      teacherId: 'teacher_2',
      uploadTime: '2026-09-01 10:15',
      updatedTime: '2026-09-01 10:15',
      format: 'pdf',
      fileSize: '2.4 MB',
      fileSizeBytes: 2516580,
      slideCount: 5,
      thumbnail: demo2Slides[0],
      slideImages: demo2Slides,
      status: 'ready',
      lastViewedSlide: 1,
      category: 'Lịch sử & Địa lý',
      subject: 'Lịch sử 8',
      description: 'Tài liệu trình chiếu PDF về Cuộc cách mạng công nghiệp và sự thay đổi đô thị hóa.'
    },
    {
      id: 'demo_presentation_3',
      fileName: 'Chu_de_STEM_Thiet_ke_xe_dua.pptx',
      title: 'Chủ đề STEM: Thiết kế xe đua thông minh',
      teacherOwner: 'Cô Lê Thị Thu',
      teacherId: 'teacher_3',
      uploadTime: '2026-09-01 14:00',
      updatedTime: '2026-09-01 14:00',
      format: 'pptx',
      fileSize: '4.2 MB',
      fileSizeBytes: 4404010,
      slideCount: 4,
      thumbnail: demo3Slides[0],
      slideImages: demo3Slides,
      status: 'ready',
      lastViewedSlide: 1,
      category: 'STEM',
      subject: 'Khoa học tự nhiên',
      description: 'Slide hướng dẫn học sinh thiết kế và chế tạo xe đuaSTEM chạy bằng động cơ mini.'
    }
  ];
}
