import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RequestReport from "../CCreate-report/Create";
import ReportProgress from "../CProgress-report/Progress";
import ReportResult from "../CResults-report/Result";

const ReportContainer = ({ status: propStatus }) => {
  const { reportId: paramReportId, vin: paramVin } = useParams();
  const [reportId, setReportId] = useState(paramReportId || null);
  const [vin, setVin] = useState(paramVin || null);
  const [status, setStatus] = useState(propStatus || (paramReportId ? "progress" : "creation"));
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ReportContainer обновился:", { reportId, vin, status });
  }, [reportId, vin, status]);

  const handleReportCreated = (id, vin) => {
    setReportId(id);
    setVin(vin);
    setStatus("progress");
    navigate(`/report/progress/${id}/${vin}`);
  };

  const handleReportComplete = (id, vin) => {
    setReportId(id);
    setVin(vin);
    setStatus("result");
    navigate(`/report/result/${id}/${vin}`);
  };

  return (
    <div>
      {status === "creation" && (
        <RequestReport
          onReportCreated={handleReportCreated}
          onReportReady={handleReportComplete}
        />
      )}
      {status === "progress" && (
        <ReportProgress
          reportId={reportId}
          vin={vin}
          onComplete={handleReportComplete}
        />
      )}
      {status === "result" && <ReportResult vin={vin} />}
    </div>
  );
};

export default ReportContainer;
