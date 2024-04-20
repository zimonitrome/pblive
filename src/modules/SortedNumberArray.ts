class SortedNumberArray {
    public items: number[] = [];

    add(item: number): void {
        if (this.contains(item)) return;

        let low = 0;
        let high = this.items.length;

        while (low < high) {
            const mid = low + Math.floor((high - low) / 2);
            if (item < this.items[mid]) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        this.items.splice(low, 0, item);
    }

    delete(item: number): boolean {
        const index = this.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    contains(item: number): boolean {
        return this.indexOf(item) !== -1;
    }

    indexOf(item: number): number {
        let low = 0;
        let high = this.items.length - 1;

        while (low <= high) {
            const mid = low + Math.floor((high - low) / 2);
            if (this.items[mid] === item) {
                return mid;
            } else if (this.items[mid] < item) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return -1; // Item not found
    }

    print(): void {
        console.log(this.items);
    }

    size(): number {
        return this.items.length;
    }

    clear(): void {
        this.items = [];
    }
}


export default SortedNumberArray;