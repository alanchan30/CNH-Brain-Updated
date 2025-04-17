import "./history.css";
import Plane from "@/assets/plane.png";
import Filter from "@/assets/filter.png";
import Search from "@/assets/search.png";
import useUser from "@/hooks/useUser";
import React, { useEffect, useState, useRef } from "react";
import { useMemo } from 'react';
import { API_URL } from "../constants";

interface HistoryItem {
  id: number;
  name: string;
  date: string;
  result: string;
}

interface HistoryResponse {
  history: HistoryItem[];
}

export default function History() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_URL}/user-fmri-history/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch data from server");
        else {
          const json: HistoryResponse = await res.json();
          setData(json.history);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleView = (item: HistoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };
  const filteredData = useMemo(() => {
    if (sortOrder === null) return data;
  
    return [...data].sort((a, b) => {
      const isANormal = a.result.toLowerCase() === "normal";
      const isBNormal = b.result.toLowerCase() === "normal";
  
      if (sortOrder === "asc") {
        if (isANormal && !isBNormal) {
          return -1
        } else {
        if (!isANormal && isBNormal) {
          return 1
        } else {
          return 0
        }
      }
      } else {
        if (!isANormal && isBNormal) {
          return -1
        } else {
        if (isANormal && !isBNormal) {
          return 1
        } else {
          return 0
        }
      };
      }
    });
  }, [data, sortOrder]);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsFilterOpen(false)
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };


  return (
    <div className="history-page">
      <div className="filter">
        <p className="filter-title"> History </p>
        <div className="filter-tools">
          <div className="filter-bar">
            <img className="filter-search" src={Search} alt="search" />
            <input className="filter-input" />
            <img className="filter-send" src={Plane} alt="plane" />
          </div >
          <div ref={dropdownRef} className="filter-container">
          <img 
          className="filter-filter" 
          src={Filter} 
          alt="filter" 
          onClick={() => setIsFilterOpen((prev) => !prev)}
          />
          {isFilterOpen && (
            <div className="filter-dropdown">
            <button onClick={() => setSortOrder("asc")}>Diagnosis: Normal First</button>
            <button onClick={() => setSortOrder("desc")}>Diagnosis: Not Normal First</button>
          </div>
          )}
          </div>
        </div>
      </div>

      <div className="table">
        <div className="table-header">
          <p className="table-header-name">Name</p>
          <p className="table-header-data">Data</p>
          <p className="table-header-result">Results</p>
        </div>

        <div className="table-data">
          {filteredData.length === 0 ? (
            <div
              className="no-data-message"
              style={{ textAlign: "center", padding: "2rem", color: "#666" }}
            >
              No history available yet. Upload an fMRI scan to get started!
            </div>
          ) : (
            currentItems.map((item) => (
              <div className="table-row" key={item.id}>
                <p className="table-cell">{item.name}</p>
                <p className="table-cell">{item.date}</p>
                <button
                  className="view-button"
                  onClick={() => handleView(item)}
                >
                  View Results
                </button>
              </div>
            ))
          )}
        </div>

        {filteredData.length > 0 && (
          <div className="pagination">
          <button 
            disabled={currentPage === 1} 
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        <div className="table-footer"></div>
        <div>
          {isModalOpen && selectedItem && (
            <div className="modal-overlay" onClick={closeModal}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Result Details</h3>
                <p>Name:{selectedItem.name}</p>
                <p>Date:{selectedItem.date}</p>
                <p>Result:{selectedItem.result}</p>
                <button onClick={closeModal}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
        )}</div>
    </div>
  );
}
