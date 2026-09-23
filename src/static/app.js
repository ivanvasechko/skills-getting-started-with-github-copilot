document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createLabeledParagraph(label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${label}:`;
    paragraph.append(strong, ` ${value}`);
    return paragraph;
  }

  function createParticipantList(participants, activityName) {
    const participantsList = document.createElement("ul");
    participantsList.className = "participants-list";

    if (!participants.length) {
      const emptyParticipant = document.createElement("li");
      emptyParticipant.className = "participant-item empty";
      emptyParticipant.textContent = "No participants yet";
      participantsList.appendChild(emptyParticipant);
      return participantsList;
    }

    participants.forEach((email) => {
      const participantItem = document.createElement("li");
      participantItem.className = "participant-item";

      const participantEmail = document.createElement("span");
      participantEmail.textContent = email;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-participant";
      removeButton.dataset.activity = activityName;
      removeButton.dataset.email = email;
      removeButton.setAttribute("aria-label", `Remove ${email} from ${activityName}`);
      removeButton.title = "Remove participant";
      removeButton.textContent = "🗑️";

      participantItem.append(participantEmail, removeButton);
      participantsList.appendChild(participantItem);
    });

    return participantsList;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const activityHeading = document.createElement("h4");
        activityHeading.textContent = name;

        const activityDescription = document.createElement("p");
        activityDescription.textContent = details.description;

        const activitySchedule = createLabeledParagraph("Schedule", details.schedule);
        const activityAvailability = createLabeledParagraph(
          "Availability",
          `${spotsLeft} spots left`
        );

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        participantsSection.append(
          participantsHeading,
          createParticipantList(details.participants, name)
        );

        activityCard.append(
          activityHeading,
          activityDescription,
          activitySchedule,
          activityAvailability,
          participantsSection
        );

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) {
      return;
    }

    const activityName = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to remove participant.";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
