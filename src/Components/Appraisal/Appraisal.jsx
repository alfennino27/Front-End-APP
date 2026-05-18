import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Col, Row, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../Config/APIurl';
import { useNavigate } from 'react-router-dom';
import '../Pekerjaan/pekerjaan.css';
import { MdFormatListBulletedAdd } from 'react-icons/md';
import { GrNotes } from "react-icons/gr";
import { debounce } from 'lodash';
import { FaFileInvoice, FaPaste, FaSearch } from 'react-icons/fa';
import { CiEdit } from 'react-icons/ci';
import { useTheme } from '../../ThemeContext';
import { getImageUrl } from '../../Utils/image';
import { DatePicker, Select, Popover, Modal, Input } from 'antd';
const { TextArea } = Input;
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { FaCircleInfo } from 'react-icons/fa6';
dayjs.extend(isoWeek);

const kriteriaList = [
  { no: 1, nama: "Kehadiran", deskripsi: "Tingkat kehadiran & ketepatan waktu dalam bekerja." },
  { no: 2, nama: "Kualitas Kerja", deskripsi: "Tingkat ketelitian & keakuratan hasil kerja." },
  { no: 3, nama: "Produktivitas", deskripsi: "Kemampuan menyelesaikan tugas dengan efisien." },
  { no: 4, nama: "Kerja Sama", deskripsi: "Kemampuan bekerja dalam tim & komunikasi." },
  { no: 5, nama: "Inisiatif", deskripsi: "Kemauan untuk mengambil tindakan tanpa disuruh." },
  { no: 6, nama: "Kedisiplinan", deskripsi: "Kepatuhan terhadap aturan & instruksi kerja." },
  { no: 7, nama: "Tanggung Jawab", deskripsi: "Kesadaran dan kepedulian terhadap pekerjaan." },
  { no: 8, nama: "Sikap", deskripsi: "Sikap terhadap rekan kerja & lingkungan kerja." },
];


const Appraisal = () => {
  const baseUrl = getApiBaseUrl();
  const { globalTheme } = useTheme();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  useEffect(() => {
    const cekLogin = () => {
      if (user == null) {
        window.location.replace('/login');
      }
      if (user.uid === 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2' || user.uid === 'w4M5JJjgGQeHFbS2nkyoCfUBE532' || user.uid === '4WGPaHicKWYr0Ny84IUh8xb9Bo62' || user.uid === 'ANGTwgX8KxXQy5Ww3cwpLrG0tFT2' || user.uid === 'gwsOqUgVXSPyWFMMHr4bJteBoYs1' || user.uid === '6D4XVa5BSSOl1ugUlkDlTea2COX2' || user.uid === 'MjOCxfNdGtf0q12BPzj0EYAcVJD3' || user.uid === 'knydS6fIBdOwHS37dDm3ZDNQXKQ2' || user.uid === 'Q3LWLX4D7Ye8hMnQVF9fa7SZb953' || user.uid === 'ep15dsFMceTBAyZvpZDiAJ4kMME3') {
        console.log('success');
      } else {
        window.location.replace('/project');
      }
    };

    cekLogin();
  }, []);

  const isMobile = window.innerWidth <= 768;


  const [dataAppraisal, setDataAppraisal] = useState(null);
  const [dataAppraisalNotes, setDataAppraisalNotes] = useState(null);
  const [note, setNote] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [scores, setScores] = useState(Array(8).fill().map(() => []));
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [weekDatesWithYear, setWeekDatesWithYear] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);



  const fetchDataAppraisal = async () => {
    try {
      const res = await fetch(`${baseUrl}/appraisal/get`);
      const data = await res.json();
      setDataAppraisal(data);
    } catch (err) {
      console.error('Error fetching appraisal:', err);
    }
  };

  const fetchDataAppraisalNotes = async () => {
    try {
      const res = await fetch(`${baseUrl}/appraisalNotes/get`);
      const data = await res.json();
      setDataAppraisalNotes(data);
    } catch (err) {
      console.error('Error fetching appraisalNotes:', err);
    }
  };


  useEffect(() => {
    fetchDataAppraisal();
    fetchDataAppraisalNotes();
  }, []);

  useEffect(() => {
    if (!selectedEmployee || weekDatesWithYear.length === 0) return;

    const newScores = Array(8).fill().map(() => Array(weekDatesWithYear.length).fill(null));

    for (let kriteria = 1; kriteria <= 8; kriteria++) {
      weekDatesWithYear.forEach((range, index) => {
        const record = dataAppraisal.find(
          (item) =>
            item.employee === selectedEmployee &&
            item.nameField === range &&
            item.noKriteria === kriteria
        );
        if (record) {
          newScores[kriteria - 1][index] = record.score;
        }
      });
    }

    setScores(newScores);
  }, [dataAppraisal, selectedEmployee, weekDatesWithYear]);





  const ScoreSelect = ({ value, onChange }) => {
    return (
      <Select
        value={value}
        onChange={(val) => {
          onChange(val === undefined ? '' : val);
        }}
        style={{ width: 80 }}
        allowClear
        placeholder="Score"
        size="small"
        disabled={
          ![
            '4WGPaHicKWYr0Ny84IUh8xb9Bo62',
            'fYpdHwXRDLhj5XGxM5FZIAvxp9E2',
            'w4M5JJjgGQeHFbS2nkyoCfUBE532',
          ].includes(user.uid)
        }
        options={[
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ]}
      />
    );
  };




  const handleChangeMonth = (date) => {
    if (!date) {
      setWeekDates([]);
      setWeekDatesWithYear([]);
      return;
    }

    const startOfMonth = date.startOf('month');
    let current = startOfMonth;

    // Geser ke Senin pertama
    while (current.day() !== 1) {
      current = current.add(1, 'day');
    }

    const weeks = [];
    const weeksWithYear = [];

    while (current.month() === date.month()) {
      const weekStart = current;
      const weekEnd = current.add(5, 'day'); // Senin–Sabtu

      // Format biasa untuk tampilan
      weeks.push(`${weekStart.format('D MMM')} - ${weekEnd.format('D MMM')}`);
      // Format lengkap untuk disimpan
      weeksWithYear.push(`${weekStart.format('D MMM YYYY')} - ${weekEnd.format('D MMM YYYY')}`);

      current = weekStart.add(7, 'day'); // ke Senin berikutnya
    }

    setWeekDates(weeks);
    setWeekDatesWithYear(weeksWithYear);
  };




  const handleScoreChange = async (value, weekIndex, nameField, kriteriaIndex) => {
    const updatedScores = [...scores];
    updatedScores[kriteriaIndex][weekIndex] = value;
    setScores(updatedScores);

    // Jika dikosongkan, hapus data
    if (value === '' || value === undefined || value === null) {
      try {
        const res = await fetch(`${baseUrl}/appraisal/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nameField,
            employee: selectedEmployee,
            noKriteria: kriteriaIndex + 1,
          }),
        });
        if (!res.ok) throw new Error('Gagal menghapus appraisal');
        console.log(`Appraisal DIHAPUS: Minggu ${nameField}, Kriteria ${kriteriaIndex + 1}`);
        fetchDataAppraisal();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Jika ada nilai, lanjutkan upsert
    try {
      const res = await fetch(`${baseUrl}/appraisal/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameField,
          employee: selectedEmployee,
          score: value,
          noKriteria: kriteriaIndex + 1,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan appraisal');
      console.log(`Appraisal tersimpan: Minggu ${nameField}, Kriteria ${kriteriaIndex + 1}`);
      fetchDataAppraisal();
    } catch (err) {
      console.error(err);
    }
  };


  const handleNoteClick = (range) => {
    setNoteDate(range); // Set noteDate dengan range yang dipilih

    const matchedNote = dataAppraisalNotes.find(
      item => item.noteDate === range && item.employee === selectedEmployee
    );

    // Jika data ditemukan, set catatan yang sesuai
    if (matchedNote) {
      setNote(matchedNote.note);
    } else {
      setNote(''); // Jika tidak ada catatan, set menjadi string kosong
    }

    setShowNotesModal(true); // Tampilkan modal
  };


  const handleSubmitCatatan = async () => {
    setShowNotesModal(false); // Tutup modal setelah submit
    try {
      const res = await fetch(`${baseUrl}/appraisalNotes/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteDate,
          employee: selectedEmployee,
          note,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan catatan');
      fetchDataAppraisalNotes();
      console.log('Catatan berhasil disimpan');
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <>
      <Container>
        <Col md={12} className='lowonganPekerjaan overflow-auto pekerjaan px-2'>


          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            ...(isMobile ? { top: -1 } : { top: 0 }),
            zIndex: 1,
            padding: '10px',
            backgroundColor: "transparent",
            color: globalTheme === "light" ? "black" : 'white',
            transition: "background-color 1s ease",
          }}>
            <h4 style={{ margin: 0 }}>Appraisal</h4>

            <div>
              <Select
                showSearch
                placeholder="Select a person"
                optionFilterProp="label"
                onChange={setSelectedEmployee}
                style={{ marginRight: "10px" }}
                options={[
                  {
                    value: 'Azwad',
                    label: 'Azwad',
                  },
                  {
                    value: 'Bang Udin',
                    label: 'Bang Udin',
                  },
                  {
                    value: 'Jena',
                    label: 'Jena',
                  },
                  {
                    value: 'Nanen',
                    label: 'Nanen',
                  },
                  {
                    value: 'Paid',
                    label: 'Paid',
                  },
                  {
                    value: 'Pakde',
                    label: 'Pakde',
                  },
                  {
                    value: 'Yoga',
                    label: 'Yoga',
                  },
                ]}
              />
              <DatePicker picker="month" onChange={handleChangeMonth} />
            </div>

          </div>


          <div style={{
            maxHeight: '80vh',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
            padding: '6px',
            backgroundColor: 'white',
            overflowX: 'auto'
          }}>
            <table className="table table-striped table-hover"
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                minWidth: '900px',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>

              {/* Header Sticky */}
              <thead className="table-light"
                style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f8f9fa',
                  zIndex: 10,
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  display: 'table',
                  width: '100%',
                  tableLayout: 'fixed'
                }}>
                <tr>
                  <th style={{ paddingY: '12px', color: "#354985" }}>No</th>
                  <th style={{ paddingY: '12px', color: "#354985" }}>Kriteria</th>
                  {weekDates.map((range, index) => (
                    <th
                      key={index}
                      style={{
                        paddingY: '12px',
                        color: '#354985',
                        textAlign: 'center',
                      }}
                    >
                      {range}
                    </th>
                  ))}


                  <th style={{ paddingY: '12px', color: "#354985", textAlign: 'center' }}>Total</th>
                </tr>
              </thead>

              {/* Isi Tabel Scrollable */}
              <tbody style={{
                display: 'block',
                maxHeight: '70vh',
                overflowY: 'auto',
                scrollbarWidth: 'thin', /* Firefox */
                scrollbarColor: '#ccc transparent', /* Firefox */
                width: '100%',
                tableLayout: 'fixed'
              }}>
                {weekDates.length > 0 && selectedEmployee && selectedEmployee !== "" ? (
                  <>
                    {kriteriaList.map((kriteria, kriteriaIndex) => (
                      <tr
                        key={kriteria.no}
                        style={{
                          borderBottom: '1px solid #eee',
                          transition: 'background 0.2s',
                          display: 'table',
                          width: '100%',
                          tableLayout: 'fixed'
                        }}
                      >
                        <td>{kriteria.no}</td>
                        <td>
                          <Popover content={<p>{kriteria.deskripsi}</p>} title="Deskripsi" trigger="hover">
                            {kriteria.nama}
                          </Popover>
                        </td>

                        {weekDatesWithYear.map((range, weekIndex) => (
                          <td key={weekIndex} style={{ textAlign: 'center' }}>
                            <ScoreSelect
                              value={scores[kriteriaIndex]?.[weekIndex] || ''}
                              onChange={(value) =>
                                handleScoreChange(value, weekIndex, range, kriteriaIndex)
                              }
                            />
                          </td>
                        ))}

                        <td style={{ textAlign: "center" }}>
                          {(() => {
                            const values = scores[kriteriaIndex]?.filter((v) => v != null);
                            if (!values || values.length === 0) return '-';
                            const average = values.reduce((a, b) => a + b, 0) / values.length;
                            return average.toFixed(1); // bulatkan 1 angka di belakang koma
                          })()}
                        </td>

                      </tr>
                    ))}

                    <tr
                      className='fw-semibold'
                      style={{
                        borderBottom: '1px solid #eee',
                        transition: 'background 0.2s',
                        display: 'table',
                        width: '100%',
                        tableLayout: 'fixed'
                      }}
                    >
                      <td></td>
                      <td>
                        <Popover
                          content={
                            <>
                              <p>
                                1. Tidak memenuhi harapan<br />
                                2. Perlu ditingkatkan<br />
                                3. Memenuhi harapan<br />
                                4. Melebihi harapan<br />
                                5. Sangat memuaskan<br />
                              </p>
                            </>
                          } title="Score" trigger="hover">
                          <FaCircleInfo
                            style={{
                              fontSize: '20px',
                              cursor: 'pointer',
                            }}
                          />
                        </Popover>
                      </td>
                      {weekDatesWithYear.map((range, index) => (
                        <td style={{ textAlign: 'center' }}>
                          <GrNotes
                            onClick={() => handleNoteClick(range)}
                            style={{
                              fontSize: '20px',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease-in-out'
                            }}
                            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                          />
                        </td>

                      ))}

                      <td style={{ textAlign: "center" }}>
                        {scores.length > 0
                          ? (scores.reduce((acc, curr) => {
                            const validScores = curr.filter(score => score != null);
                            return acc + (validScores.length > 0 ? validScores.reduce((a, b) => a + b) / validScores.length : 0);
                          }, 0) / scores.length).toFixed(1)
                          : '-'}
                      </td>


                    </tr>
                  </>
                ) : (
                  <tr style={{
                    borderBottom: '1px solid #eee',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                    display: 'table',
                    width: '100%',
                    tableLayout: 'fixed'
                  }}>
                    <td colSpan="3" style={{ textAlign: "center" }}>Please select a month and employee first.</td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>





        </Col>
      </Container>


      <Modal
        title="Catatan"
        open={showNotesModal}
        onOk={handleSubmitCatatan}
        onCancel={() => setShowNotesModal(false)}
        footer={
          [
            ['4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532'].includes(user.uid) && (
              <Button key="ok" onClick={handleSubmitCatatan}>
                Submit
              </Button>
            )
          ]
        }
      >
        <TextArea
          key={`${noteDate}-${selectedEmployee}`}
          rows={7}
          placeholder="Tulis catatan di sini..."
          defaultValue={note}
          readOnly={
            !['4WGPaHicKWYr0Ny84IUh8xb9Bo62', 'fYpdHwXRDLhj5XGxM5FZIAvxp9E2', 'w4M5JJjgGQeHFbS2nkyoCfUBE532'].includes(user.uid)
          }
          onChange={useCallback(
            debounce((e) => setNote(e.target.value), 300),
            []
          )}
        />
      </Modal>



    </>
  );
};



export default Appraisal;
