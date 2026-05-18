import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels"; // Import plugin datalabels
import '../Dashboard/dashboard.css';
// import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap
import { Carousel, DatePicker } from 'antd';
import { getApiBaseUrl } from '../../Config/APIurl';
import dayjs from 'dayjs';

const contentStyle = {
  margin: 0,
  height: '160px',
  color: '#fff',
  lineHeight: '160px',
  textAlign: 'center',
  background: '#364d79',
};


const DashboardFinance = () => {
  const baseUrl = getApiBaseUrl();
  const chartsRef = [useRef(null), useRef(null), useRef(null)];
  const chartInstances = [useRef(null), useRef(null), useRef(null)];
  const penjualanChartRef = useRef(null);
  const penjualanChartInstance = useRef(null);
  const pengeluaranChartRef = useRef(null);
  const pengeluaranChartInstance = useRef(null);
  const cashflowChartRef = useRef(null);
  const cashflowChartInstance = useRef(null);
  const [freeCash, setFreeCash] = useState(0);


  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const saldoRes = await fetch(`${baseUrl}/dashboard/piechart/saldo/get`);
        const saldoData = await saldoRes.json();
        console.log(saldoData);

        const piutangRes = await fetch(`${baseUrl}/dashboard/piechart/piutang/get`);
        const piutangData = await piutangRes.json();
        console.log(piutangData);

        const hutangRes = await fetch(`${baseUrl}/dashboard/piechart/hutang/get`);
        const hutangData = await hutangRes.json();
        console.log(hutangData);

        const newChartData = [
          {
            title: "Saldo",
            labels: ["Kas", "Bank BCA", "Tabungan Blu"], // Kunci diubah ke array
            data: [saldoData.kas, saldoData.bca, saldoData.blu], // Ambil dari objek API
            colors: ["#2cd518", "#184ed5", "#36A2EB"],
          },
          {
            title: "Piutang",
            labels: ["Piutang Customer", "Piutang Lain"],
            data: [piutangData.piutang_customer, piutangData.piutang_lain],
            colors: ["#d91bfe", "#791bfe"],
          },
          {
            title: "Hutang",
            labels: ["Hutang Supplier", "Hutang Sisa"],
            data: [hutangData.hutang_supplier, hutangData.hutang_sisa],
            colors: ["#fe1b60", "#fe8c1b"],
          },
        ];

        console.log("Formatted Chart Data:", newChartData);
        setChartData(newChartData);

        const totalSaldo = saldoData.kas + saldoData.bca + saldoData.blu;
        const totalPiutang = piutangData.piutang_customer + piutangData.piutang_lain;
        const totalHutang = hutangData.hutang_supplier + hutangData.hutang_sisa;

        const calculatedFreeCash = totalSaldo + totalPiutang - totalHutang;

        setFreeCash(calculatedFreeCash);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);


  // const chartData = [
  //   {
  //     title: "Saldo",
  //     labels: ["Kas", "Bank BCA", "Tabungan Blu"],
  //     data: [40, 30, 30],
  //     colors: ["#2cd518", "#184ed5", "#36A2EB"],
  //   },
  //   {
  //     title: "Piutang",
  //     labels: ["Piutang Sisa", "Piutang Customer"],
  //     data: [25, 45],
  //     colors: ["#d91bfe", "#791bfe"],
  //   },
  //   {
  //     title: "Hutang",
  //     labels: ["Supplier", "Hutang Lain"],
  //     data: [40, 25],
  //     colors: ["#fe1b60", "#fe8c1b"],
  //   },
  // ];

  useEffect(() => {
    console.log("pie chart", chartData);

    if (chartData.length === 0) return; // Jangan jalankan jika chartData masih kosong

    chartData.forEach((chart, index) => {
      if (chartInstances[index].current) {
        chartInstances[index].current.destroy();
      }

      const ctx = chartsRef[index].current.getContext("2d");
      chartInstances[index].current = new Chart(ctx, {
        type: "pie",
        data: {
          labels: chart.labels,
          datasets: [
            {
              data: chart.data,
              backgroundColor: chart.colors,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  const nilai = tooltipItem.raw;
                  const formattedValue = new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(nilai);

                  return `${tooltipItem.label}: ${formattedValue}`;
                },
              },
            },
            datalabels: {
              display: true,
              formatter: (value, ctx) => {
                let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                return ((value / sum) * 100).toFixed(1) + "%";
              },
              color: "white",
              font: { weight: "bold", size: 16 },
              anchor: "center",
              align: "center",
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    });
  }, [chartData]); // Sekarang useEffect hanya berjalan setelah chartData di-update

  //barchart
  const [selectedYear, setSelectedYear] = useState(dayjs().format('YYYY'));

  const [penjualanData, setPenjualanData] = useState(null);
  const [pengeluaranData, setPengeluaranData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);

  const fetchPenjualanData = async (year) => {
    try {
      const response = await fetch(`${baseUrl}/dashboard/barchart/penjualan-grossprofit/get?year=${year}`);
      if (!response.ok) {
        throw new Error("Gagal mengambil data");
      }
      const data = await response.json();
      console.log("penjualan");
      console.log(data);
      setPenjualanData(data);
    } catch (error) {
      console.error("Error fetching penjualan data:", error);
    }
  };

  const fetchPengeluaranData = async (year) => {
    try {
      const response = await fetch(`${baseUrl}/dashboard/barchart/pengeluaran/get?year=${year}`);
      if (!response.ok) {
        throw new Error("Gagal mengambil data");
      }
      const data = await response.json();
      console.log("pengeluaran");
      console.log(data);
      setPengeluaranData(data);
    } catch (error) {
      console.error("Error fetching penjualan data:", error);
    }
  };

  const fetchCashflowData = async (year) => {
    try {
      const response = await fetch(`${baseUrl}/dashboard/barchart/cashflow/get?year=${year}`);
      if (!response.ok) {
        throw new Error("Gagal mengambil data");
      }
      const data = await response.json();
      console.log("cashflow");
      console.log(data);
      setCashflowData(data);
    } catch (error) {
      console.error("Error fetching penjualan data:", error);
    }
  };

  useEffect(() => {
    fetchPenjualanData(selectedYear);
    fetchPengeluaranData(selectedYear);
    fetchCashflowData(selectedYear);
  }, [selectedYear]);



  // const penjualanData = {
  //   title: "Penjualan",
  //   labels: [
  //     "Januari",
  //     "Februari",
  //     "Maret",
  //     "April",
  //     "Mei",
  //     "Juni",
  //     "Juli",
  //     "Agustus",
  //     "September",
  //     "Oktober",
  //     "November",
  //     "Desember",
  //   ],
  //   data: [50, 70, 60, 80, 90, 75, 85, 95, 100, 110, 120, 130],
  // };

  // const grossProfitData = {
  //   title: "Gross Profit",
  //   labels: [
  //     "Januari",
  //     "Februari",
  //     "Maret",
  //     "April",
  //     "Mei",
  //     "Juni",
  //     "Juli",
  //     "Agustus",
  //     "September",
  //     "Oktober",
  //     "November",
  //     "Desember",
  //   ],
  //   data: [30, 40, 40, 50, 60, 45, 55, 75, 70, 80, 85, 90],
  // };

  useEffect(() => {
    if (!penjualanData) return;

    if (penjualanChartInstance.current) {
      penjualanChartInstance.current.destroy();
    }

    const penjualanCtx = penjualanChartRef.current.getContext("2d");
    const gradient = penjualanCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#0059f4");
    gradient.addColorStop(1, "#77e4ff");

    const gradient2 = penjualanCtx.createLinearGradient(0, 0, 0, 400);
    gradient2.addColorStop(0, "#08d03b");
    gradient2.addColorStop(1, "#aaf1bc");

    // ✅ Filter data negatif, ubah ke null biar tidak ditampilkan
    const penjualanFiltered = penjualanData.penjualan.data.map((val) =>
      val >= 0 ? val : null
    );
    const grossProfitFiltered = penjualanData.grossProfit.data.map((val) =>
      val >= 0 ? val : null
    );

    penjualanChartInstance.current = new Chart(penjualanCtx, {
      type: "bar",
      data: {
        labels: penjualanData.penjualan.labels,
        datasets: [
          {
            label: penjualanData.penjualan.title,
            data: penjualanFiltered, // ✅ Gunakan data yang sudah difilter
            backgroundColor: gradient,
          },
          {
            label: penjualanData.grossProfit.title,
            data: grossProfitFiltered, // ✅ Gunakan data yang sudah difilter
            backgroundColor: gradient2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            display: true,
            color: "white",
            font: {
              weight: "bold",
              size: 10,
            },
            rotation: -90, // Putar teks
            formatter: (value) => (value !== null ? `Rp ${value.toLocaleString("id-ID")}` : ""), // ✅ Tampilkan hanya jika bukan null
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => {
      penjualanChartInstance.current?.destroy();
    };
  }, [penjualanData]);


  // const pengeluaranData = {
  //   title: "Pengeluaran",
  //   labels: [
  //     "Januari",
  //     "Februari",
  //     "Maret",
  //     "April",
  //     "Mei",
  //     "Juni",
  //     "Juli",
  //     "Agustus",
  //     "September",
  //     "Oktober",
  //     "November",
  //     "Desember",
  //   ],
  //   data: [30, 40, 80, 50, 40, 75, 65, 45, 100, 50, 70, 80],
  // };

  useEffect(() => {
    if (!pengeluaranData) return;

    // Render pengeluaran chart
    if (pengeluaranChartInstance.current) {
      pengeluaranChartInstance.current.destroy();
    }

    const pengeluaranCtx = pengeluaranChartRef.current.getContext("2d");
    const gradient = pengeluaranCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#fd2c78");
    gradient.addColorStop(1, "#f788b0");

    // ✅ Filter data negatif, ubah ke null biar tidak ditampilkan
    // const pengeluaranFiltered = pengeluaranData.pengeluaran.data.map((val) =>
    //   val >= 0 ? val : null
    // );

    pengeluaranChartInstance.current = new Chart(pengeluaranCtx, {
      type: "bar",
      data: {
        labels: pengeluaranData.pengeluaran.labels,
        datasets: [
          {
            label: pengeluaranData.pengeluaran.title,
            data: pengeluaranData.pengeluaran.data,
            backgroundColor: gradient,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            display: true,
            color: "white",
            font: {
              weight: "bold",
              size: 15,
            },
            rotation: -90, // Putar teks
            formatter: (value) => (value !== null ? `Rp ${value.toLocaleString("id-ID")}` : ""), // ✅ Tampilkan hanya jika bukan null
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => {
      chartInstances.forEach((instance) => instance.current?.destroy());
      pengeluaranChartInstance.current?.destroy();
    };
  }, [pengeluaranData]);

  // const cashflowData = {
  //   title: "Cash Flow",
  //   labels: [
  //     "Januari",
  //     "Februari",
  //     "Maret",
  //     "April",
  //     "Mei",
  //     "Juni",
  //     "Juli",
  //     "Agustus",
  //     "September",
  //     "Oktober",
  //     "November",
  //     "Desember",
  //   ],
  //   data: [30, 40, 80, 50, 40, 75, 65, 45, 100, 50, 70, 80],
  // };

  useEffect(() => {
    if (!cashflowData) return;
    // Render cashflow chart
    if (cashflowChartInstance.current) {
      cashflowChartInstance.current.destroy();
    }

    const cashflowCtx = cashflowChartRef.current.getContext("2d");
    const gradient = cashflowCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#08d03b");
    gradient.addColorStop(1, "#aaf1bc");

    // ✅ Filter data negatif, ubah ke null biar tidak ditampilkan
    // const cashflowFiltered = cashflowData.cashflow.data.map((val) =>
    //   val >= 0 ? val : null
    // );

    cashflowChartInstance.current = new Chart(cashflowCtx, {
      type: "bar",
      data: {
        labels: cashflowData.cashflow.labels,
        datasets: [
          {
            label: cashflowData.cashflow.title,
            data: cashflowData.cashflow.data,
            backgroundColor: gradient,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            display: true,
            color: "white",
            font: {
              weight: "bold",
              size: 15,
            },
            rotation: -90, // Putar teks
            formatter: (value) => (value !== null ? `Rp ${value.toLocaleString("id-ID")}` : ""), // ✅ Tampilkan hanya jika bukan null
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => {
      chartInstances.forEach((instance) => instance.current?.destroy());
      cashflowChartInstance.current?.destroy();
    };
  }, [cashflowData]);

  return (
    <div className="container mt-3">




      <div
        style={{
          height: "85vh",
          backgroundColor: "#f8f9fa", // Light background color
          borderRadius: "10px", // Rounded corners
          padding: "20px", // Space around the chart
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Light shadow effect
          flexWrap: "wrap", // Untuk membungkus jika ruang tidak cukup
        }}
      >
        <p style={{ fontSize: "20px", fontWeight: "bold" }}>Dashboard Finance</p>



        <div
          style={{
            display: "flex",
            width: "100%",
            height: "80vh", // Tinggi sesuai kebutuhan
          }}
        >
          {/* Bagian kiri (3/4) */}
          <div
            style={{
              flex: "4",
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "10px",
              height: "72vh", // Pastikan mengambil tinggi penuh
              border: "1px solid #c4c4c4",
              marginRight: "20px",
              overflow: "hidden", // Cegah konten meluap
            }}
          >
            <Carousel arrows={true} infinite={false} dotPosition={"bottom"} draggable={true}>
              <div
                className="container px-4 pb-4"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between", // Membuat jarak antara teks dan DatePicker
                    alignItems: "center", // Memastikan mereka sejajar secara vertikal
                  }}
                >
                  <h5 style={{ margin: 0 }}>Penjualan</h5>
                  <DatePicker
                    value={selectedYear ? dayjs(selectedYear, 'YYYY') : null}
                    onChange={(date, dateString) => {
                      if (dateString) {
                        setSelectedYear(dateString);
                      }
                    }}
                    picker="year"
                  />
                </div>

                <div
                  className="mt-2"
                  style={{
                    width: "100%",
                    height: "50vh",
                    position: "relative",
                  }}
                >
                  <canvas ref={penjualanChartRef} />
                </div>
              </div>
              <div
                className="container px-4 pb-4"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between", // Membuat jarak antara teks dan DatePicker
                    alignItems: "center", // Memastikan mereka sejajar secara vertikal
                  }}
                >
                  <h5 style={{ margin: 0 }}>Pengeluaran</h5>
                  <DatePicker
                    value={selectedYear ? dayjs(selectedYear, 'YYYY') : null}
                    onChange={(date, dateString) => {
                      if (dateString) {
                        setSelectedYear(dateString);
                      }
                    }}
                    picker="year"
                  />
                </div>
                <div
                  className="mt-2"
                  style={{
                    width: "100%",
                    height: "50vh",
                    position: "relative",
                  }}
                >
                  <canvas ref={pengeluaranChartRef} />
                </div>
              </div>
              <div
                className="container px-4 pb-4"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between", // Membuat jarak antara teks dan DatePicker
                    alignItems: "center", // Memastikan mereka sejajar secara vertikal
                  }}
                >
                  <h5 style={{ margin: 0 }}>Cash Flow</h5>
                  <DatePicker
                    value={selectedYear ? dayjs(selectedYear, 'YYYY') : null}
                    onChange={(date, dateString) => {
                      if (dateString) {
                        setSelectedYear(dateString);
                      }
                    }}
                    picker="year"
                  />
                </div>
                <div
                  className="mt-2"
                  style={{
                    width: "100%",
                    height: "50vh",
                    position: "relative",
                  }}
                >
                  <canvas ref={cashflowChartRef} />
                </div>
              </div>
            </Carousel>
          </div>

          {/* Bagian kanan (1/4) */}
          <div
            style={{
              flex: "1",
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "10px",
              height: "72vh", // Pastikan mengambil tinggi penuh
              border: "1px solid #c4c4c4",
              marginRight: "20px",
              overflow: "auto", // Cegah konten meluap
            }}
          >
            <div className="mt-2 mb-4">
              {chartData.map((chart, index) => (
                <div
                  key={index}
                  className="d-flex flex-column align-items-center mx-2 mb-4" // Setiap chart diletakkan dalam container flex column dan ada jarak antar chart
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <h5 className="mb-0">{chart.title}</h5>
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative", // Untuk menjaga chart tetap terpusat
                    }}
                  >
                    <canvas ref={chartsRef[index]} />
                  </div>
                </div>
              ))}
            </div>
            <h6 style={{ marginTop: "50px" }} className="text-center">Free Cash :</h6>
            <h6 className="text-center">Rp. {freeCash.toLocaleString("id-ID")}</h6>
          </div>
        </div>


      </div>

    </div>
  );
};

export default DashboardFinance;
