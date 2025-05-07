import Plane from "@/assets/plane.png";
import Filter from "@/assets/filter.png";
import Search from "@/assets/search.png";
import useUser from "@/hooks/useUser";
import React, { useEffect, useState, useRef } from "react";
import { useMemo } from 'react';
import { API_URL } from "../constants";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
  fmri_id: number;
  user_id: string;
  date: string;
  file_link: string;
  description: string;
  title: string;
  gender: string;
  age: number;
  diagnosis: string;
  brain_obj: any;
  model_result: number;
  atlas: string;
}

export default function History() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_URL}/user-fmri-history/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch data from server");
        
        const json = await res.json();
        console.log("History data:", json);
        
        // Ensure we're setting an array to the state
        if (Array.isArray(json)) {
          setData(json);
        } else if (json.history && Array.isArray(json.history)) {
          setData(json.history);
        } else {
          console.error("API response is not in the expected format:", json);
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching data", error);
        setData([]);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleView = (item: HistoryItem) => {
    if (item.fmri_id) {
      navigate(`/results/${item.fmri_id}`);
    } else {
      // Fallback to modal view if no fmri_id is available
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Filter data based on search query and sort order
  const filteredData = useMemo(() => {
    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [];
    
    // First filter by search query
    let filtered = dataArray;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = dataArray.filter(item => 
        item.fmri_id.toString().includes(query) ||
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.diagnosis && item.diagnosis.toLowerCase().includes(query))
      );
    }
    
    // Then apply sorting
    if (sortOrder === null) return filtered;

    return [...filtered].sort((a, b) => {
      if (sortOrder === "asc") {
        // Sort by model_result: 0 (Healthy) first
        return a.model_result - b.model_result;
      } else {
        // Sort by model_result: 1 (Unhealthy) first
        return b.model_result - a.model_result;
      }
    });
  }, [data, searchQuery, sortOrder]);

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

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(filteredData) ? filteredData.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil((Array.isArray(filteredData) ? filteredData.length : 0) / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Header Section */}
      <div className="w-full py-12 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-6">History</h1>

        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="flex items-center border-2 rounded-lg px-3 py-2 bg-white w-64 md:w-80">
              <img className="w-5 h-5 mr-2" src={Search} alt="search" />
              <input
                className="flex-grow outline-none"
                placeholder="Search by ID, title, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <img className="w-5 h-5 ml-2 cursor-pointer" src={Plane} alt="search" />
              </button>
            </div>
          </form>

          {/* Filter Button */}
          <div ref={dropdownRef} className="relative">
            <button
              className="p-2 rounded-lg bg-white border-2 hover:bg-gray-100 transition-colors"
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <img className="w-5 h-5" src={Filter} alt="filter" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                  onClick={() => setSortOrder("asc")}
                >
                  Prediction: Healthy First
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => setSortOrder("desc")}
                >
                  Prediction: Unhealthy First
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                  onClick={() => setSortOrder(null)}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-white py-3 font-medium"
          style={{ backgroundColor: '#007bff' }}>
          <div className="col-span-1 px-2 truncate">ID</div>
          <div className="col-span-2 px-2 truncate">Date</div>
          <div className="col-span-1 px-2 truncate">Gender</div>
          <div className="col-span-1 px-2 truncate">Age</div>
          <div className="col-span-2 px-2 truncate">Diagnosis</div>
          <div className="col-span-2 px-2 truncate">Prediction</div>
          <div className="col-span-3 px-2 text-center">View page</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {!Array.isArray(filteredData) || filteredData.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {searchQuery ? "No results found. Try a different search term." : "No history available yet. Upload an fMRI scan to get started!"}
            </div>
          ) : (
            currentItems.map((item) => (
              <div key={item.fmri_id || Math.random()} className="grid grid-cols-12 py-4 hover:bg-gray-50">
                <div className="col-span-1 px-2 font-medium truncate" title={String(item.fmri_id)}>{item.fmri_id}</div>
                <div className="col-span-2 px-2 text-gray-600 truncate" title={item.date}>{item.date ? formatDate(item.date) : 'N/A'}</div>
                <div className="col-span-1 px-2 text-gray-600 truncate" title={item.gender || 'N/A'}>{item.gender || 'N/A'}</div>
                <div className="col-span-1 px-2 text-gray-600 truncate" title={String(item.age || 'N/A')}>{item.age || 'N/A'}</div>
                <div className="col-span-2 px-2 text-gray-600 truncate" title={item.diagnosis || 'N/A'}>{item.diagnosis || 'N/A'}</div>
                <div
                  className="col-span-2 px-2 text-gray-600 truncate"
                  title={String(item.model_result !== undefined ? item.model_result : 'N/A')}
                >
                  {Number(item.model_result) === 1
                    ? "Probable to be Autistic"
                    : Number(item.model_result) === 0
                      ? "Probable to be Neurotypical"
                      : "Prediction Failed"}
                </div>
                <div className="col-span-3 px-2 flex justify-center">
                  <button
                    onClick={() => handleView(item)}
                    className="!bg-blue-500 hover:!bg-blue-600 text-white px-3 py-1 rounded-md transition-colors text-sm whitespace-nowrap"
                  >
                    View Results
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {Array.isArray(filteredData) && filteredData.length > 0 && (
          <div className="py-4 flex justify-center bg-gray-50 border-t">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show first page, last page, current page and pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded border ${currentPage === pageNum
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-100"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Result Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">ID:</span> {selectedItem.fmri_id}</p>
              <p><span className="font-medium">Title:</span> {selectedItem.title}</p>
              <p><span className="font-medium">Date:</span> {formatDate(selectedItem.date)}</p>
              <p><span className="font-medium">Diagnosis:</span> {selectedItem.diagnosis}</p>
              <p><span className="font-medium">Atlas:</span> {selectedItem.atlas}</p>
              <p><span className="font-medium">Prediction:</span>
                <span className={selectedItem.model_result === 0 ? "text-green-600" : "text-red-600"}>
                  {selectedItem.model_result === 1
                    ? " Probable to be Autistic"
                    : selectedItem.model_result === 0
                      ? " Probable to be Neurotypical"
                      : " Prediction Failed"}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
