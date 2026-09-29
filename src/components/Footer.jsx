export default function Footer ({subtitle}) {
  return (
    <footer className="crm-footer">
      <div className="footer-container">

        {/* CRM мэдээлэл */}
        <div className="footer-section">
          <h2>CRM System</h2>
          <p>
            Харилцагчийн мэдээлэл, борлуулалт болон
            харилцааг нэг дороос удирдах систем.
          </p>
        </div>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
        {/* Холбоо барих */}
        <div className="footer-section">
          <h3>Холбоо барих</h3>
          <p>📞 9999-9999</p>
          <p>✉️ crm@example.com</p>
          <p>📍 Улаанбаатар, Монгол</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 CRM System. Бүх эрх хуулиар хамгаалагдсан.</p>
      </div>
    </footer>
  );
}