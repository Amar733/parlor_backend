#!/bin/bash

# Test Data for API Testing
# Base URL
BASE_URL="http://localhost:5001"

echo "🏥 Hospital Management System - API Test Suite"
echo "=============================================="
echo

# Test Data IDs
ADMIN_ID="688ba862b79249c2062db7f8"
DOCTOR_ID="68889eaf2837bec04fdef000"
PATIENT_ID="686b6bb290eaf25a8dc49e83"
SERVICE_ID="688f03c3b79249c2062dc311"

echo "📋 Test Data Summary:"
echo "Admin ID: $ADMIN_ID"
echo "Doctor ID: $DOCTOR_ID"
echo "Patient ID: $PATIENT_ID"
echo "Service ID: $SERVICE_ID"
echo

echo "🔍 1. Testing Master Time Slots"
echo "GET $BASE_URL/api/timeslots?source=master"
curl -s "$BASE_URL/api/timeslots?source=master" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 2. Testing Doctor Availability Check"
echo "GET $BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=09:00"
curl -s "$BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=09:00" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 3. Testing Doctor Availability for Different Time"
echo "GET $BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=11:00"
curl -s "$BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=11:00" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 4. Testing Doctor Time Slots"
echo "GET $BASE_URL/api/timeslots/doctor/$DOCTOR_ID"
curl -s "$BASE_URL/api/timeslots/doctor/$DOCTOR_ID" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 5. Testing Doctor Availability for Specific Date"
echo "GET $BASE_URL/api/timeslots/availability/$DOCTOR_ID/2025-08-04"
curl -s "$BASE_URL/api/timeslots/availability/$DOCTOR_ID/2025-08-04" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "📝 6. Testing New Appointment Booking"
echo "POST $BASE_URL/api/appointment-booking/book"
curl -s -X POST "$BASE_URL/api/appointment-booking/book" \
-H "Content-Type: application/json" \
-d '{
  "doctorId": "'$DOCTOR_ID'",
  "service": "General Consultation",
  "serviceId": "'$SERVICE_ID'",
  "date": "2025-08-04",
  "time": "11:00",
  "notes": "API test booking",
  "patientFirstName": "Test",
  "patientLastName": "Patient",
  "patientContact": "+1111222333",
  "patientAge": 28,
  "patientGender": "Male",
  "patientAddress": "Test Address"
}' | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 7. Testing Availability After Booking"
echo "GET $BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=11:00"
curl -s "$BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=11:00" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 8. Testing All Services"
echo "GET $BASE_URL/api/services"
curl -s "$BASE_URL/api/services" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "🔍 9. Testing All Doctors (Public)"
echo "GET $BASE_URL/api/public/doctors"
curl -s "$BASE_URL/api/public/doctors" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "📝 10. Testing Slot Full Scenario (Book 4 more appointments for same slot)"
for i in {1..4}; do
  echo "Booking appointment $i/4 for 09:00 slot..."
  curl -s -X POST "$BASE_URL/api/appointment-booking/book" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "'$DOCTOR_ID'",
    "service": "General Consultation",
    "date": "2025-08-04",
    "time": "09:00",
    "notes": "Load test booking '$i'",
    "patientFirstName": "Load'$i'",
    "patientLastName": "Test",
    "patientContact": "+111122233'$i'",
    "patientAge": 30,
    "patientGender": "Male"
  }' | jq '.success, .message' || echo "Request failed"
done
echo -e "\n"

echo "🔍 11. Testing Slot Full Response"
echo "GET $BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=09:00"
curl -s "$BASE_URL/api/appointment-booking/check-availability?doctorId=$DOCTOR_ID&date=2025-08-04&time=09:00" | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "📝 12. Testing Booking When Slot is Full"
echo "POST $BASE_URL/api/appointment-booking/book (Should fail)"
curl -s -X POST "$BASE_URL/api/appointment-booking/book" \
-H "Content-Type: application/json" \
-d '{
  "doctorId": "'$DOCTOR_ID'",
  "service": "General Consultation",
  "date": "2025-08-04",
  "time": "09:00",
  "notes": "This should fail",
  "patientFirstName": "Should",
  "patientLastName": "Fail",
  "patientContact": "+9999999999",
  "patientAge": 30,
  "patientGender": "Male"
}' | jq '.' || echo "JSON parsing failed"
echo -e "\n"

echo "✅ API Test Suite Complete!"
echo "=============================================="
