# Check dia chinh cu moi Viet Nam

Web app tra cuu don vi hanh chinh Viet Nam truoc/sau sap nhap 2025, dua tren dataset Hugging Face [`tmquan/sapnhap-bando-vn`](https://huggingface.co/datasets/tmquan/sapnhap-bando-vn).

## Chuc nang

- Tim kiem ten tinh, xa, phuong cu hoac moi.
- Loc theo `Tat ca`, `Tinh/thanh`, `Xa/phuong`.
- Hien thi ket qua, ly do khop, danh sach don vi tien nhiem, thong tin nghi quyet.
- Ban do Leaflet highlight tinh/thanh hoac centroid xa/phuong.
- Data build tu parquet va GeoJSON cua Hugging Face vao `public/data`.

## Chay local

```bash
npm install
npm run data:build
npm run dev
```

## Kiem tra va build

```bash
npm test
npm run build
```

## Luu y giay phep

Dataset duoc phan phoi theo CC-BY-NC 4.0. Can kiem tra dieu khoan nguon truoc khi dung thuong mai.
