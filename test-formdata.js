const formData = new FormData();
formData.set("surat_tugas", "12345.pdf");
const payloadData = {};
formData.forEach((value, key) => {
  payloadData[key] = value;
});
console.log(payloadData);
