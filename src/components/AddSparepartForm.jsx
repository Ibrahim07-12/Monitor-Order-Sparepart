import { useState } from "react";
import { addSparepart } from "../firestore";
import "./AddSparepartForm.css";

const AddSparepartForm = ({ onClose }) => {
  const [name, setName] = useState("");
  const [specification, setSpecification] = useState("");
  const [machine, setMachine] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderedBy, setOrderedBy] = useState("");
  const [orderDate, setOrderDate] = useState(new Date());
  const [urgency, setUrgency] = useState("normal");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await addSparepart({
        name,
        specification,
        machine,
        quantity,
        orderedBy,
        orderDate,
        urgency,
      });
      setSuccess(true);
      // Clear form
      setName("");
      setSpecification("");
      setMachine("");
      setQuantity(1);
      setOrderedBy("");
      setOrderDate(new Date());
      setUrgency("normal");
    } catch (err) {
      setError("Gagal menambahkan sparepart. Silakan coba lagi.");
      console.error("Error adding sparepart:", err);
    }

    setLoading(false);
  };

  return (
    <div className="add-sparepart-form">
      <h2>Tambah Sparepart</h2>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">Sparepart berhasil ditambahkan!</div>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Nama Sparepart *</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="specification">Spesifikasi *</label>
        <input
          type="text"
          id="specification"
          value={specification}
          onChange={(e) => setSpecification(e.target.value)}
          required
        />

        <label htmlFor="machine">Mesin *</label>
        <input
          type="text"
          id="machine"
          value={machine}
          onChange={(e) => setMachine(e.target.value)}
          required
        />

        <label htmlFor="quantity">Jumlah *</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
          min="1"
        />

        <label htmlFor="orderedBy">Diorder Oleh *</label>
        <input
          type="text"
          id="orderedBy"
          value={orderedBy}
          onChange={(e) => setOrderedBy(e.target.value)}
          required
        />

        <label htmlFor="orderDate">Tanggal Order *</label>
        <input
          type="date"
          id="orderDate"
          value={orderDate.toISOString().substring(0, 10)}
          onChange={(e) => setOrderDate(new Date(e.target.value))}
          required
        />

        <label htmlFor="urgency">Keterangan *</label>
        <select
          id="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          required
        >
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Menambahkan..." : "Tambah Sparepart"}
        </button>
      </form>

      <button className="close-button" onClick={onClose}>
        Tutup
      </button>
    </div>
  );
};

export default AddSparepartForm;
