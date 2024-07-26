import React, { useState, useEffect } from "react";
import { ProgressBar, Dropdown, ButtonGroup } from "react-bootstrap";
import { fetchData, postData } from "../../api";
import { Form } from "react-bootstrap";
import Tag from "../basic-ui/Tag";
import faceFallback from '../../assets/images/faces/face1.jpg';

const BasicTable = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 1)); // Current date state
  const [selectedTag, setSelectedTag] = useState("");
  const handleTagClick = (label) => {
    setSelectedTag(label); // Update the state with the clicked tag's label
  };
  const handleImageError = (e) => {
    e.target.src = faceFallback;
  };


  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]); // Fetch attendance data when currentDate changes

  const fetchAttendanceData = async () => {
    try {
      const year = 2024;
      const month = 6; // Month is 0-indexed, so add 1
      const day = currentDate.getDate(); // Get current day of the month

      const data = await fetchData(`/attendance?month=${month}&year=${year}&day=${day}`);
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };
  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handlePreviousDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(nextDate);
  };

  const [notification, setNotification] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [toReset, setToReset] = useState(false);
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await postData('evaluation-ai/', { content: selectedTag });
      if (response.status === 200) {
        setNotification({ message: response.message, type: 'success' });
        setSelectedTag(''); // Reset form on success
        setToReset(!toReset); // Trigger useEffect to refetch data
      } else {
        setNotification({ message: 'Failed to submit the request. Please check your prompt again.', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Failed to submit the request.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
          <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-memory"></i>
          </span>{" "}
          Evaluation.AI <small className="text-muted">Powered by Sakura.AI</small>
        </h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <Form.Group>
                <h5 htmlFor="exampleTextarea1">Prompt</h5>
                <ul className="list-star">
                  <li>Ask anything about employees attendance</li>
                  <li>Evaluate performance of employees based on progress and attendance</li>
                  <li>Work life balance and overtime evaluation</li>
                  <li>Employee absence impact</li>
                  <li>Salary and progress analysis</li>
                  <li>Ask any detail information about attendance, overtime, working hours</li>
                  <li>Evaluate tardiness and early leave</li>
                </ul>
                <ul className="list-ticked">
                  <li>Support multiple languages</li>
                  <li>Can multiple information at the same time</li>
                </ul>

                <textarea
                  className="form-control"
                  id="exampleTextarea1"
                  rows="4"
                  value={selectedTag} // Bind textarea value to selectedTag state
                  onChange={(e) => setSelectedTag(e.target.value)} // Handle manual changes if needed
                ></textarea>

                {/* Tags with onClick handler */}
                <Tag
                  label="Siapa karyawan dengan performa terburuk di bulan Juni 2024"
                  color="blue"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Berapa total overtime yang diakumulasikan di bulan Juni 2024"
                  color="red"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Karyawan dengan jam kerja paling sedikit di bulan Juni 2024"
                  color="orange"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Rata-rata overtime hours dari karyawan di perusahaan Sakura Internal"
                  color="gray"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Rata-rata working hours dan overtime hours dari semua karyawan di bulan Juni 2024"
                  color="gray"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Karyawan dengan jam terlambat paling banyak"
                  color="green"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Siapa saja yang izin di bulan Juni"
                  color="purple"
                  onClick={handleTagClick}
                />
                
                <br />
                <button className="btn btn-gradient-info mr-2 mt-4" disabled>
                  Preview
                </button>
                <button
                  type="button"
                  className="btn btn-gradient-primary mr-2 mt-4"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </Form.Group>
              {loading && <div className="spinner-border text-primary" role="status"><span className="sr-only">Loading...</span></div>}
              {notification.message && (
                <div
                  className={`alert mt-4 ${notification.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                  role="alert"
                >
                  {notification.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white mr-2">
            <i className="mdi mdi-domain"></i>
          </span>{" "}
          Attendance by Project{" "}
        </h3>
      </div>

      <Dropdown>
        <Dropdown.Toggle variant="btn btn-gradient-primary" id="dropdownMenuOutlineButton1">
          {`${currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* Dropdown items for months/years */}
        </Dropdown.Menu>
      </Dropdown>

      <ButtonGroup className="ml-2">
        <button className="btn btn-sm btn-gradient-info mr-2 mt-4" onClick={handlePreviousDay}>
          Previous Day
        </button>
        <button className="btn btn-sm btn-gradient-info mt-4" onClick={handleNextDay}>
          Next Day
        </button>
      </ButtonGroup>

      <div className="row mt-4">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              {attendanceData.length === 0 ? (
                <p>No attendance records found for {currentDate.toLocaleDateString()}</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Attendance Date</th>
                        <th>Attendance Status</th>
                        <th>Overtime Hours</th>
                        <th>Work Hours</th>
                        <th>Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((attendance) => (
                        <tr key={attendance.id}>
                          <td>
                            <img
                              src={require(`../../assets/images/faces/face${attendance.profile_pic?attendance.profile_pic:'1'}.jpg`)}
                              alt="user icon"
                              onError={handleImageError}
                              style={{
                                width: "30px",
                                height: "auto",
                                marginRight: "14px",
                              }}
                            />
                            {`${attendance.first_name || ''} ${attendance.last_name || ''}`}
                          </td>
                          <td>{formatDate(attendance.attendance_date)}</td>
                          <td>{attendance.attendance_status}</td>
                          <td>{attendance.overtime_hours}</td>
                          <td>{attendance.work_hours}</td>
                          <td>{attendance.company || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicTable;
