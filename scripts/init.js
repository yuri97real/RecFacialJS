document.addEventListener("DOMContentLoaded", () => {
    const recFacial = new RecFacial();

    const btnSave = document.querySelector("button#btn-save");
    const btnUsers = document.querySelector("button#btn-users");

    const inputUsername = document.querySelector("input#username");

    recFacial.handleDetect = () => {
        btnSave.removeAttribute("disabled");
    };

    btnSave.addEventListener("click", () => {
        inputUsername.classList.remove("invalid");

        const username = String(inputUsername.value).trim();

        if (!username) {
            inputUsername.focus();
            inputUsername.classList.add("invalid");
        }

        recFacial.saveDescriptor(username);

        M.Toast.dismissAll();

        M.toast({
            html: "Salvo com sucesso",
            classes: "rounded green",
        });
    });

    btnUsers.addEventListener("click", () => {
        const modal = document.querySelector(".modal#users");
        const tBody = modal.querySelector("table tbody");

        const { labels = [], descriptors = [] } =
            recFacial.setFaceMatcher() || {};

        tBody.innerHTML = "";

        labels.forEach((label, index) => {
            const currentUserDescriptors = descriptors[index];
            const numDescriptors = currentUserDescriptors.length;

            const tr = document.createElement("tr");
            const tdRemove = document.createElement("td");
            const btnRemove = document.createElement("button");

            btnRemove.innerText = "Remover";

            btnRemove.classList.add(
                "btn",
                "red",
                "waves-effect",
                "waves-light"
            );

            btnRemove.addEventListener("click", () => {
                recFacial.removeUser(label);
                document
                    .querySelector(`tbody tr:nth-child(${index + 1})`)
                    .classList.add("hide");
            });

            tr.innerHTML = `
                <td>${label}</td>
                <td>${numDescriptors}</td>
            `;

            tdRemove.appendChild(btnRemove);
            tr.appendChild(tdRemove);

            tBody.appendChild(tr);
        });

        modal.M_Modal?.open();
    });

    M.AutoInit();
});
