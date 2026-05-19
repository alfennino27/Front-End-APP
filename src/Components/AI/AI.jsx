import React, { useState, useEffect } from "react";
import { Container, Form, Button, Spinner, Alert } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import klf_logo from "../../assets/images/klflogo.png";
import { AiOutlineSend } from "react-icons/ai";
import { getApiBaseUrl } from '../../Config/APIurl';
import { format } from "date-fns";
import { id } from 'date-fns/locale';

const KLFAI = () => {
  const baseUrl = getApiBaseUrl();
  const [messages, setMessages] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingText, setLoadingText] = useState("AI Berpikir");

  const [dataProjects, setDataProjects] = useState([]);
  const [dataComments, setDataComments] = useState([]);
  const [dataReplies, setDataReplies] = useState([]);

  const fetchDataProjects = async () => {
    try {
      const response = await fetch(`${baseUrl}/projects/get`);
      const dataFromDB = await response.json();
      console.log("Data Projects", dataFromDB);
      setDataProjects(dataFromDB);
    } catch (error) {
      console.error('Gagal mengambil data Projects:', error);
    }
  };


  const fetchDataComments = async () => {
    try {
      const response = await fetch(`${baseUrl}/AI/comments/all/get`);
      const dataFromDB = await response.json();
      const formatted = dataFromDB.map(doc => {
        const { id, text, idProduct, date, category } = doc;
        return { id, text, idProduct, date, category };
      });
      console.log("Data Comments", formatted);
      setDataComments(formatted);
    } catch (error) {
      console.error('Gagal mengambil data Comments:', error);
    }
  };


  const fetchDataReplies = async () => {
    try {
      const response = await fetch(`${baseUrl}/AI/replies/all/get`);
      const dataFromDB = await response.json();
      const formatted = dataFromDB.map(doc => {
        const { id, commentId, text, idProduct, date, category } = doc;
        return { id, commentId, text, idProduct, date, category };
      });
      console.log("Data Replies", formatted);
      setDataReplies(formatted);
    } catch (error) {
      console.error('Gagal mengambil data Replies:', error);
    }
  };


  useEffect(() => {
    fetchDataProjects();
    fetchDataComments();
    fetchDataReplies();
  }, []);

  useEffect(() => {
    if (loading) {
      const loadingAnimation = ["AI Berpikir", "AI Berpikir.", "AI Berpikir..", "AI Berpikir...", "AI Berpikir....", "AI Berpikir....."];
      let index = 0;

      const interval = setInterval(() => {
        setLoadingText(loadingAnimation[index]);
        index = (index + 1) % loadingAnimation.length;
      }, 250);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const sendMessage = async (message) => {
    setLoading(true);
    setError("");
    setResponse("");

    const idMatch = message.match(/\[([^\]]+)\]/); // Tangkap semua teks di dalam [ ]
    const idProduct = idMatch ? idMatch[1].trim() : null;



    let modifiedPrompt = ``;

    if (idProduct) {
      // Filter komentar dan balasan berdasarkan idProduct
      const relatedProject = dataProjects.find((item) => item.id === idProduct);
      const relatedComments = dataComments.filter((item) => item.idProduct === idProduct);
      const relatedReplies = dataReplies.filter((item) => item.idProduct === idProduct);

      console.log("related data project", relatedProject);
      console.log("related data comments", relatedComments);
      console.log("related data replies", relatedReplies);

      // Jika ada komentar atau balasan yang sesuai
      if (relatedComments.length > 0 || relatedReplies.length > 0) {
        let dataProgress = `📌 **Progress orderan dengan ID**: **${idProduct}**\n\n`;

        dataProgress += `**📝 Nama Buyer: ${relatedProject.Buyer}**\n`;
        dataProgress += `**📝 Nama Barang: ${relatedProject.NamaBarang}**\n`;
        dataProgress += `**📝 Detail Barang: ${relatedProject.Spesifikasi}**\n`;
        dataProgress += `**📝 Persentase progres: kurang lebih ${relatedProject.Percentage}%**\n`;

        // Kelompokkan komentar berdasarkan category
        const groupedComments = relatedComments.reduce((acc, comment) => {
          acc[comment.category] = acc[comment.category] || [];
          acc[comment.category].push(comment);
          return acc;
        }, {});

        Object.keys(groupedComments).forEach((category) => {
          dataProgress += `**🗂 Kategori: ${category}**\n`;

          groupedComments[category].forEach((comment, index) => {
            dataProgress += `${index + 1}. ${comment.text} (${format(comment.date.toDate(), 'd MMMM yyyy, HH.mm', { locale: id })})\n`;

            // Cari reply yang berhubungan dengan komentar ini
            const repliesForComment = relatedReplies.filter(
              (reply) => reply.commentId === comment.id
            );

            if (repliesForComment.length > 0) {
              repliesForComment.forEach((reply, idx) => {
                dataProgress += `   ↳ ${idx + 1}. ${reply.text} (${format(reply.date.toDate(), 'd MMMM yyyy, HH.mm', { locale: id })})\n`;
              });
            }
          });

          dataProgress += "\n";
        });

        modifiedPrompt = `${message} (berikan respon dengan bahasa Indonesia, anggap anda adalah AI Customer Assistant perusahaan mebel bernama Karya Logam Furniture, jangan lupa beri sapaan dan perkenalkan diri anda yaitu AI Customer Assistant Karya Logam Furniture, berikan info progres orderan customer berdasarkan data berikut: ${dataProgress} , data data tersebut itu berasal dari aplikasi kantor yang digunakan untuk berkomunikasi antara sesama karyawan jadi mereka itu bukan berkomunikasi dengan customer, buatkan kesimpulan deskriptif saja tentang progresnya dan data sensitif jangan diberi tahu)`;
      } else {
        setLoading(false);
        setResponse(`Tidak ditemukan progres untuk orderan dengan ID ${idProduct}.`);
        return;
      }
    } else {
      modifiedPrompt = `${message} (berikan respon dengan bahasa Indonesia, anggap anda adalah AI Customer Assistant perusahaan mebel bernama Karya Logam Furniture, jika ada pertanyaan diluar tentang permebelan tolong sama sekali jangan dijawab!)`;
    }

    // console.log("console", modifiedPrompt)

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-prover-v2:free",
          messages: [{ role: "user", content: modifiedPrompt }],
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data?.choices?.length > 0) {
        setResponse(data.choices[0].message.content || "No response");
      } else {
        setError("Terjadi kesalahan dalam mendapatkan respon AI.");
      }
    } catch (err) {
      setLoading(false);
      setError("Gagal menghubungi server. Periksa koneksi Anda.");
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messages.trim()) {
      setError("Masukkan pertanyaan terlebih dahulu!");
      return;
    }
    sendMessage(messages);
  };

  return (
    <Container className="d-flex flex-column vh-85 px-4 pt-3">
      {/* Header */}
      <div className="d-flex align-items-center gap-2 justify-content-center mb-2">
        <img src={klf_logo} alt="logo-klf" style={{ height: "40px" }} />
        <h4 className="fw-bold m-0" style={{ fontSize: "20px", color: "#d19e1f" }}>
          KLF AI
        </h4>
      </div>

      {/* Chat Container */}
      <div
        className="flex-grow-1 border rounded p-4 bg-light shadow-sm"
        style={{
          height: "55vh",
          borderRadius: "12px",
        }}
      >
        <h5 className="fw-bold text-dark px-2">Respon AI :</h5>
        <div className="bg-white rounded-2 p-2 overflow-auto mt-2" style={{ border: "1px solid #c9c9c9", height: "45vh" }}>
          {loading ? (
            <p className="text-muted px-2">{loadingText}</p>
          ) : (
            <div className="mt-2 px-2">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <Form onSubmit={handleSubmit} className="mt-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="d-flex align-items-center border rounded p-3 bg-light shadow-sm">
          <Form.Control
            as="textarea"
            rows={4}
            value={messages}
            onChange={(e) => setMessages(e.target.value)}
            placeholder="Tulis pertanyaan di sini..."
            className="border-2 bg-white flex-grow-1"
            style={{ resize: "none", outline: "none" }}
          />
          <Button
            type="submit"
            variant="primary"
            className="ms-2 px-3 py-2 rounded-pill"
            disabled={loading}
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <span className="d-flex align-items-center gap-2">
                Kirim <AiOutlineSend />
              </span>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default KLFAI;
