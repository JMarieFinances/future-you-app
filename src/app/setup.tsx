import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput
} from "react-native";

export default function SetupScreen() {
  const [salary, setSalary] = useState("");
  const [sideIncome, setSideIncome] = useState("");
  const [businessIncome, setBusinessIncome] = useState("");
  const [otherIncome, setOtherIncome] = useState("");

  const [rentMortgage, setRentMortgage] = useState("");
  const [utilities, setUtilities] = useState("");
  const [phone, setPhone] = useState("");
  const [internet, setInternet] = useState("");
  const [insurance, setInsurance] = useState("");
  const [carPayment, setCarPayment] = useState("");
  const [childcare, setChildcare] = useState("");

  const [creditCards, setCreditCards] = useState("");
  const [studentLoans, setStudentLoans] = useState("");
  const [personalLoans, setPersonalLoans] = useState("");

  const [groceries, setGroceries] = useState("");
  const [gas, setGas] = useState("");
  const [eatingOut, setEatingOut] = useState("");
  const [shopping, setShopping] = useState("");
  const [entertainment, setEntertainment] = useState("");
  const [pets, setPets] = useState("");

  const handleContinue = () => {
  const incomeDetails = {
    "Salary / Paycheck": Number(salary) || 0,
    "Side Income": Number(sideIncome) || 0,
    "Business Income": Number(businessIncome) || 0,
    "Other Income": Number(otherIncome) || 0,
  };

  const obligationDetails = {
    "Rent / Mortgage": Number(rentMortgage) || 0,
    Utilities: Number(utilities) || 0,
    Phone: Number(phone) || 0,
    Internet: Number(internet) || 0,
    Insurance: Number(insurance) || 0,
    "Car Payment": Number(carPayment) || 0,
    Childcare: Number(childcare) || 0,
  };

  const debtDetails = {
    "Credit Cards": Number(creditCards) || 0,
    "Student Loans": Number(studentLoans) || 0,
    "Personal Loans": Number(personalLoans) || 0,
  };

  const lifestyleDetails = {
    Groceries: Number(groceries) || 0,
    Gas: Number(gas) || 0,
    "Eating Out": Number(eatingOut) || 0,
    Shopping: Number(shopping) || 0,
    Entertainment: Number(entertainment) || 0,
    Pets: Number(pets) || 0,
  };

  const totalIncome = Object.values(incomeDetails).reduce((a, b) => a + b, 0);
  const totalObligations = Object.values(obligationDetails).reduce((a, b) => a + b, 0);
  const totalDebt = Object.values(debtDetails).reduce((a, b) => a + b, 0);
  const totalLifestyle = Object.values(lifestyleDetails).reduce((a, b) => a + b, 0);

  const safeToSpend =
    totalIncome - totalObligations - totalDebt - totalLifestyle;

  const housingProtectionTarget = (Number(rentMortgage) || 0) * 4;

  router.push({
    pathname: "/setup-goals",
    params: {
      income: totalIncome,
      obligations: totalObligations,
      debt: totalDebt,
      lifestyle: totalLifestyle,
      safeToSpend,
      housingCost: Number(rentMortgage) || 0,
      housingProtectionTarget,

      incomeDetails: JSON.stringify(incomeDetails),
      obligationDetails: JSON.stringify(obligationDetails),
      debtDetails: JSON.stringify(debtDetails),
      lifestyleDetails: JSON.stringify(lifestyleDetails),
    },
  });
};

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        Build Your Plan
      </Text>

      <Text style={sectionStyle}>Income</Text>

      <TextInput
        placeholder="Salary / Paycheck"
        value={salary}
        onChangeText={setSalary}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Side Income"
        value={sideIncome}
        onChangeText={setSideIncome}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Business Income"
        value={businessIncome}
        onChangeText={setBusinessIncome}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Other Income"
        value={otherIncome}
        onChangeText={setOtherIncome}
        keyboardType="numeric"
        style={inputStyle}
      />

      <Text style={sectionStyle}>Monthly Obligations</Text>

      <TextInput
        placeholder="Rent / Mortgage"
        value={rentMortgage}
        onChangeText={setRentMortgage}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Utilities"
        value={utilities}
        onChangeText={setUtilities}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Internet"
        value={internet}
        onChangeText={setInternet}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Insurance"
        value={insurance}
        onChangeText={setInsurance}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Car Payment"
        value={carPayment}
        onChangeText={setCarPayment}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Childcare"
        value={childcare}
        onChangeText={setChildcare}
        keyboardType="numeric"
        style={inputStyle}
      />

      <Text style={sectionStyle}>Debt</Text>

      <TextInput
        placeholder="Credit Cards"
        value={creditCards}
        onChangeText={setCreditCards}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Student Loans"
        value={studentLoans}
        onChangeText={setStudentLoans}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Personal Loans"
        value={personalLoans}
        onChangeText={setPersonalLoans}
        keyboardType="numeric"
        style={inputStyle}
      />

      <Text style={sectionStyle}>Lifestyle Spending</Text>

      <TextInput
        placeholder="Groceries"
        value={groceries}
        onChangeText={setGroceries}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Gas"
        value={gas}
        onChangeText={setGas}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Eating Out"
        value={eatingOut}
        onChangeText={setEatingOut}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Shopping"
        value={shopping}
        onChangeText={setShopping}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Entertainment"
        value={entertainment}
        onChangeText={setEntertainment}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Pets"
        value={pets}
        onChangeText={setPets}
        keyboardType="numeric"
        style={inputStyle}
      />

      <Pressable
        onPress={handleContinue}
        style={{
          backgroundColor: "black",
          padding: 16,
          borderRadius: 12,
          marginTop: 20,
          marginBottom: 40,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Generate Plan
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
};

const sectionStyle = {
  fontSize: 20,
  fontWeight: "bold" as const,
  marginTop: 16,
};