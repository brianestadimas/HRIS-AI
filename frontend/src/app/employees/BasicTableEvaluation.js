import React, { useState, useEffect } from "react";
import { ProgressBar } from "react-bootstrap";
import { fetchData, postData } from "../../api";
import { Form } from "react-bootstrap";
import Tag from "../basic-ui/Tag";
import faceFallback from '../../assets/images/faces/face1.jpg';

const BasicTable = () => {
  const [groupedEmployees, setGroupedEmployees] = useState({});
  const [selectedTag, setSelectedTag] = useState("");
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [toReset, setToReset] = useState(false);

  const handleTagClick = (label) => {
    setSelectedTag(label); // Update the state with the clicked tag's label
  };
  const handleImageError = (e) => {
    e.target.src = faceFallback;
  };

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await fetchData("employees");
        if (data && data.length > 0) {
          const grouped = groupEmployeesByCompany(data);
          setGroupedEmployees(grouped);
          console.log(grouped); // Log after state update
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    }

    fetchEmployees();
  }, [toReset]);

  const groupEmployeesByCompany = (employees) => {
    const groupedEmployees = {};
    employees.forEach((employee) => {
      if (!groupedEmployees[employee.company]) {
        groupedEmployees[employee.company] = [];
      }
      groupedEmployees[employee.company].push(employee);
    });
    return groupedEmployees;
  };
  
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
          Employee.AI <small className="text-muted">Powered by Sakura.AI</small>
        </h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <Form.Group>
                <h5 htmlFor="exampleTextarea1">Prompt</h5>
                <ul className="list-star">
                  <li>Ask anything about employees</li>
                  <li>Evaluate performance of employees based on progress and attendance</li>
                  <li>Ask any detail information about employees</li>
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
                  label="Berapa rata-rata working hours dari karyawan di perusahaan Sakura Internal"
                  color="purple"
                  onClick={handleTagClick}
                />
                <br />
                <Tag
                  label="Posisi dengan rata-rata gaji tertinggi di perusahaan Sakura SSS dan Sakura Internal"
                  color="green"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Berapa total overtime yang diakumulasikan di bulan Juni 2024"
                  color="red"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Rata-rata progress karyawan di perusahaan Sakura Internal"
                  color="indigo"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Pengeluaran total gaji perusahaan Sakura SSS di bulan Juni 2024"
                  color="brown"
                  onClick={handleTagClick}
                />
                <Tag
                  label="Karyawan dengan progress paling rendah di bulan Juni 2024"
                  color="blue"
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

    </div>
  );
};


export default BasicTable;
