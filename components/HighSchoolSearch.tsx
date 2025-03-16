"use client";
import {useEffect, useRef, useState} from "react";
import {FaBook} from "react-icons/fa";
import {Input} from "@/components/ui/input";

const HighSchoolSearch = ({ onSelect, Style }) => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const fetchPredictions = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!apiKey) {
          console.error("Google API key is not defined in environment variables");
          return;
        }
        const response = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey, // Replace with your working key
            },
            body: JSON.stringify({
              input: `${query} high school`, // Bias toward high schools
              includedRegionCodes: ["us"],
              includedPrimaryTypes: ["school"], // Filter to schools
            }),
          }
        );

        if (!response.ok) {
          console.error("API Error:", response.status, await response.text());
          return;
        }

        const data = await response.json();
        // Filter suggestions to ensure "high school" is in the name
        const highSchoolSuggestions = (data.suggestions || []).filter((suggestion) =>
          suggestion.placePrediction.text.text.toLowerCase().includes("high school")
        );
        setSuggestions(highSchoolSuggestions);
        console.log("Filtered High School Predictions:", highSchoolSuggestions);
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchPredictions();
  }, [query]);

  const handleInput = (e) => setQuery(e.target.value);

  const handleSelect = (suggestion) => {
    const placeName = suggestion.placePrediction.text.text;
    const placeId = suggestion.placePrediction.placeId;
    onSelect(placeName, placeId);
    setQuery(placeName); // Update input with selected name
    setSuggestions([]); // Clear suggestions
  };

  if(Style === 'SignUp') {
    return (
        <div className="relative">
          <FaBook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
              ref={inputRef}
              type="text"
              placeholder="Search for your high school"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
              value={query}
              onChange={handleInput}
          />
          {suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                    <li
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelect(suggestion)}
                    >
                      {suggestion.placePrediction.text.text}
                    </li>
                ))}
              </ul>
          )}
        </div>
    );
  } else {
    return (
        <>
        <Input
            id="name"
            ref={inputRef}
            value={query}
            placeholder="Search for your high school"
            onChange={handleInput}
            className="col-span-3"
        />
              {suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded mt-16 max-h-20 overflow-auto">
                {suggestions.map((suggestion, index) => (
                    <li
                        key={index}
                        className="p-1 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelect(suggestion)}
                    >
                      {suggestion.placePrediction.text.text}
                    </li>
                ))}
              </ul>
          )}
        </>
    )
  }
};

export default HighSchoolSearch;