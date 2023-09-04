const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");

const USDT_SUPPLY = BigInt(1000000000000000000000000);
describe("Salary", function () {
    async function deploySalaryFixture() {
        const [owner, Alice,Bob,Charli] = await ethers.getSigners();
        const USDTContract = await ethers.getContractFactory("MyERC20");
        const USDT = await USDTContract.deploy("USDT", "USDT");
        await USDT.mint(owner.address, USDT_SUPPLY);
        const Salary = await ethers.getContractFactory("Salary");
        const salary = await Salary.deploy(USDT.target);
      return { salary, USDT, owner, Alice,Bob,Charli};
    }
  
    describe("Deployment", function () {
      it("Should set the right init parament", async function () {
        const { salary, USDT, owner } = await loadFixture(deploySalaryFixture);
        expect(await USDT.balanceOf(owner.address)).to.equal(USDT_SUPPLY);
      });
    });

    describe("Pay salary", function () {
        it("pay one salary", async function () {
            const { salary, USDT, owner , Alice,Bob,Charli} = await loadFixture(deploySalaryFixture);
            const salary_amount = BigInt(10000000000000000000);
            expect(await salary.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Alice.address)).not.to.be.reverted;
            expect(await USDT.balanceOf(Alice.address)).to.equal(0);
            expect(await USDT.transfer(Alice.address, salary_amount)).not.to.be.reverted;
            expect(await USDT.balanceOf(Alice.address)).to.equal(salary_amount);
            expect(await USDT.balanceOf(Bob.address)).to.equal(0);
            await USDT.connect(Alice).approve(salary.target, USDT_SUPPLY);
            expect(await salary.connect(Alice).paySalary(Bob.address, salary_amount, 2023,9,4)).not.to.be.reverted;
            expect(await USDT.balanceOf(Bob.address)).to.equal(salary_amount);
        });
        it("pay batch salary", async function () {
            const { salary, USDT, owner , Alice,Bob,Charli} = await loadFixture(deploySalaryFixture);
            const salary_amount = BigInt(10000000000000000000);
            const salary_total = BigInt(20000000000000000000);
            expect(await salary.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", Alice.address)).not.to.be.reverted;
            expect(await USDT.balanceOf(Alice.address)).to.equal(0);
            expect(await USDT.transfer(Alice.address, salary_total)).not.to.be.reverted;
            expect(await USDT.balanceOf(Alice.address)).to.equal(salary_total);

            expect(await USDT.balanceOf(Bob.address)).to.equal(0);
            expect(await USDT.balanceOf(Charli.address)).to.equal(0);
            await USDT.connect(Alice).approve(salary.target, USDT_SUPPLY);
            const account_list = [
                Bob.address,
                Charli.address,
            ];
            const amount_list = [
                salary_amount,
                salary_amount,
            ];
            expect(await salary.connect(Alice).paySalaryBatch(account_list, amount_list, 2023,9,4)).not.to.be.reverted;
            expect(await USDT.balanceOf(Bob.address)).to.equal(salary_amount);
            expect(await USDT.balanceOf(Charli.address)).to.equal(salary_amount);
        });
    });
});